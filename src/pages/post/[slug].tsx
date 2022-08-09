import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBr from 'date-fns/locale/pt-BR'
import parseISO from 'date-fns/fp/parseISO';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({post}:PostProps) {
  
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>
  }

  const totalPostWords = post.data.content.reduce((acc, item) => {
    const heading = item.heading.trim().split(' ').length;
    const body = item.body.reduce((accumulator, { text }) => {
      return (accumulator += text.trim().split(' ').length);
    }, 0);

    return (acc += heading + body);
  }, 0);

  const minutesToReadThePost = Math.ceil(totalPostWords / 200);
  
  return (
    <>
      <Header/>
      <img src={post.data.banner.url} className={styles.banner}/>
      <main className={commonStyles.container}>
          <article className={styles.postContainer}>
              <strong>{post.data.title}</strong>
              <div className={styles.info}>
                <FiCalendar className={styles.icone}/>
                <span>
                    {format(
                      parseISO(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBr,
                      }
                    ).toString()}
                </span>
                <FiUser className={styles.icone} />
                <span>{post.data.author}</span>
                <span>{minutesToReadThePost} min</span>
              </div>
              {post.data.content.map( content => (
                <div key={content.heading} className={styles.content}>
                  <span>
                    {content.heading}
                  </span>
                  {content.body.map((body, index) => (
                    <p key={index}>
                      {body.text}
                    </p>
                  ))}
                </div>
              ))}
          </article>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts', {
    lang: 'pt-BR',
  });

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient({});

  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date, 
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
    redirect: 60 * 30, 
  };
};
