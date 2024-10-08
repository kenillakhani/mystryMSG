'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import axios, { AxiosError } from 'axios';
import { useDebounceCallback } from 'usehooks-ts';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { ApiResponse } from '@/types/ApiResponse';
import { signUpSchema } from '@/schemas/signUpSchema';

export default function SignUpForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const debounced = useDebounceCallback((value: string) => setUsername(value), 500);

  // Ensures that the component renders only on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  // Check for username availability on the client side
  useEffect(() => {
    if (!username) return;

    setIsCheckingUsername(true);
    const checkUsername = async () => {
      try {
        const response = await axios.get<ApiResponse>(`/api/check-username-unique?username=${username}`);
        setUsernameMessage(response.data.message);
      } catch (error) {
        setUsernameMessage('Error checking username. Please try again.');
      } finally {
        setIsCheckingUsername(false);
      }
    };

    checkUsername();
  }, [username]);

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post<ApiResponse>(
        '/api/sign-up',
        data,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      toast({
        title: 'Success',
        description: response.data.message,
      });

      router.replace(`/verify/${data.username}`);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      console.error('Error during sign-up:', axiosError.message);

      if (axiosError.response) {
        console.error('Response data:', axiosError.response.data);
        console.error('Response status:', axiosError.response.status);
      }

      const errorMessage = axiosError.response?.data.message || 'There was a problem with your sign-up. Please try again.';
      const errorType = axiosError.response?.status === 400 ? 'Validation Error' : 'Sign Up Failed';

      toast({
        title: errorType,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClient) return null; // Prevents server-side rendering

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-800">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
            Join MysticTalk
          </h1>
          <p className="mb-4">Sign up to start your anonymous adventure</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              name="username"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      debounced(e.target.value);
                    }}
                  />
                  {isCheckingUsername && <Loader2 className="animate-spin" />}
                  {!isCheckingUsername && usernameMessage && (
                    <p
                      className={`text-sm ${
                        usernameMessage === 'Username is unique'
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {usernameMessage}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <Input {...field} name="email" />
                  <p className='text-muted text-gray-400 text-sm'>We will send you a verification code</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <Input type="password" {...field} name="password" />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Sign Up'}
            </Button>
          </form>
        </Form>
        <div className="text-center mt-4">
          <p>
            Already a member?{' '}
            <Link href="/sign-in" className="text-blue-600 hover:text-blue-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
