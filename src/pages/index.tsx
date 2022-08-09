import { GetStaticProps } from 'next';
import { Head } from 'next/document';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Header from '../components/Header';
import { useState } from 'react';

import Link from 'next/link';
import { format } from 'date-fns';
import ptBr from 'date-fns/locale/pt-BR'
import parseISO from 'date-fns/fp/parseISO';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

 export default function Home({postsPagination} : HomeProps )  
 {
  
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleNextPage(): Promise<void>
  {
    if (nextPage === null) 
    {
      return;
    }

    const nextPost = await fetch(`${nextPage}`).then(response => response.json());

    setNextPage(nextPost.next_page)
    setPosts([...posts, ...nextPost.results])
  }
    return (
      <>
            <Header/>
            <main className={commonStyles.container}>
                <div className={styles.postContainer}>
                    { posts.map( post => (
                        <div key={post.uid} className={styles.post}>
                          <Link href={`/post/${post.uid}`}>
                            <a>
                              <strong>{post.data.title}</strong>
                              <span className={styles.subtitle}>{post.data.subtitle}</span>
                              <div>
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
                              </div>
                            </a>
                          </Link>
                        </div>  
                    ))}
                    {
                      nextPage && ( 
                                    <button onClick={handleNextPage}
                                            type="button" className={styles.botao}>
                                      Carregar mais posts
                                    </button>
                                )
                    }
                      
                </div>
            </main>
      </>
    )
 }

 export const getStaticProps: GetStaticProps = async () => 
 {
    const prismic = getPrismicClient({});

    const postsResponse = await prismic.getByType('posts');

    const postsPagination = {
      next_page: postsResponse.next_page,
      results: postsResponse.results
    }

    return {
      props: {
        postsPagination
      },
      revalidate: 60 * 60 * 24,
    }
 };
