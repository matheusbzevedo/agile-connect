'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { Loader2, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDebounce } from 'use-debounce';
import { z } from 'zod';

const schema = z.object({
  query: z.string().min(1, 'Please enter a word'),
});

export default function Home() {
  const queryClient = new QueryClient();
  const {
    register,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { query: '' },
  });
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const query = watch('query');
  const [debouncedQuery] = useDebounce(query, 1000);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dictionary', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) {
        return null;
      }

      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${debouncedQuery}`,
      );

      if (!res.ok) {
        throw new Error('Word not found');
      }

      const response = await res.json();

      setAudioUrl(response[0].phonetics[0]?.audio);

      return response;
    },
    enabled: !!debouncedQuery,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <div className='flex min-h-screen flex-col items-center justify-center bg-white p-4 text-black dark:bg-gray-900 dark:text-white'>
        <button
          type="button"
          onClick={toggleTheme}
          className='absolute top-4 right-4 rounded-full bg-gray-200 p-2 transition-all dark:bg-gray-800'
        >
          {theme === 'dark' ? (
            <Sun className="text-yellow-400" />
          ) : (
            <Moon className="text-gray-900" />
          )}
        </button>
        <Input
          type="text"
          placeholder="Search for a word..."
          {...register('query')}
          className="w-full max-w-md rounded-md border border-gray-300 p-3 text-lg shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        {errors.query && (
          <p className="mt-1 text-red-500 text-sm">{errors.query.message}</p>
        )}
        <div className="mt-4 w-full max-w-md">
          {isLoading && (
            <Loader2 className="mx-auto animate-spin text-gray-600 dark:text-gray-300" />
          )}
          {error && <p className="text-center text-red-500">Word not found.</p>}
          {data && (
            <Card className='dark:border-gray-700 dark:bg-gray-800'>
              <CardContent className="p-4">
                <h2 className="font-semibold text-xl">{data[0].word}</h2>
                <p className='text-gray-600 italic dark:text-gray-400'>
                  {data[0].phonetic}
                </p>
                <ul className="mt-2">
                  {data[0].meanings.map((meaning, index) => (
                    <li key={index} className="mt-2">
                      <strong>{meaning.partOfSpeech}</strong>:{' '}
                      {meaning.definitions[0].definition}
                    </li>
                  ))}
                </ul>
                {audioUrl ? (
                  <audio controls className="mt-2">
                    <source src={audioUrl} type="audio/mpeg" />
                    <track kind="captions" />
                  </audio>
                ) : (
                  <p>Loading audio...</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}
