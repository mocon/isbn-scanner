'use client'

import { useState } from 'react'
import Image from 'next/image'
import { BarcodeScanner } from 'react-barcode-scanner'
import 'react-barcode-scanner/polyfill'
import axios from 'axios'
import { toast } from 'sonner'

const googleSheetUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL

const isbnApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ISBN_API_BASE_URL,
  headers: {
    Authorization: process.env.NEXT_PUBLIC_ISBN_API_KEY,
    Accept: '*/*',
  },
})

const n8nApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_N8N_API_BASE_URL,
  headers: {
    Authorization: process.env.NEXT_PUBLIC_N8N_API_KEY,
  },
})

export default function Home() {
  const [isScanning, setIsScanning] = useState(false)

  async function handleCapture(barcode: unknown) {
    // @ts-expect-error, no typing for `react-barcode-scanner` result
    const isbn = barcode?.rawValue ?? null

    if (isbn) {
      toast(`Scanned ISBN: ${isbn}.`)

      try {
        const { data } = await isbnApi.get(`/book/${isbn}`)

        if (data) toast('Book data retrieved from ISBNdb.')

        // Send book data to n8n workflow
        const response = await n8nApi.post(
          '/webhook/7f60c9bc-af58-4be4-9cee-fe21b3461b73',
          { ...data },
        )

        if (response.status === 200) {
          toast('Book data sent to n8n workflow.')
          setIsScanning(false)
        }
      } catch (error) {
        toast('An error occurred. Please try again.')
        setIsScanning(false)
        console.error(error)
      }
    }
  }

  return (
    <div className='grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
      <main className='flex flex-col gap-8 row-start-2 items-center sm:items-start'>
        <Image
          className='dark:invert'
          src='https://nextjs.org/icons/next.svg'
          alt='Next.js logo'
          width={180}
          height={38}
          priority
        />
        <ol className='list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]'>
          <li className='mb-2'>
            Scan a book{"'"}s barcode with the Scan Book button.
          </li>
          <li>Check the Google Sheet to see the book{"'"}s information.</li>
        </ol>

        <div className='flex gap-4 items-center flex-col sm:flex-row'>
          <a
            className='rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5'
            onClick={() => setIsScanning(true)}
            role='button'
          >
            Scan Book
          </a>
          <a
            className='rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44'
            href={googleSheetUrl}
            target='_blank'
            rel='noopener noreferrer'
          >
            Open Google Sheet
          </a>
        </div>
      </main>

      {isScanning && (
        <>
          <BarcodeScanner
            className='fixed top-0 right-0 bottom-0 left-0 z-40'
            options={{ formats: ['ean_13'] }}
            onCapture={handleCapture}
          />
          <div className='fixed bottom-0 left-0 right-0 z-50 p-4'>
            <a
              className='rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5'
              onClick={() => setIsScanning(false)}
              role='button'
            >
              Close Scanner
            </a>
          </div>
        </>
      )}
    </div>
  )
}
