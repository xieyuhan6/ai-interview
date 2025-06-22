import InterviewCard from '@/components/InterviewCard'
import { Button } from '@/components/ui/button'
import { dummyInterviews } from '@/constants'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
// import { getCurrentUser } from '@/lib/actions/auth.action'
// import { redirect } from 'next/navigation'

const page = async () => {
  // const user = await getCurrentUser();
  //     if (!user) {
  //       redirect('/sign-in')}
  return (
    <>
      <section className="card-cta">
        <div className='flex flex-col gap-6 max-w-lg'>
          <h2>Get Interview ready with AI-power</h2>
          <p className='text-lg'>Practice on real interview questions</p>
          <Button asChild className='btn-primary max-sm:w-full'>
            <Link href="/interview">Start An Interview</Link>
          </Button>
        </div>
        <Image src="/robot.png" alt='robot' width={400} height={400} className='max-sm:hidden' priority/>
      </section>
      <section className='flex flex-col gap-6 mt-8'>
        <h2>Your interviews</h2>
        <div className='interview-section flex flex-row space-x-5'>
          {dummyInterviews.map((interview)=>(
              <InterviewCard {...interview} key={interview.id}/>
              ))}
            {/* <p>you haven&apos;t taken any interview yet</p> */}
        </div>
      </section>
      <section className='flex flex-col gap-6 mt-8'>
        <h2>Take an interview</h2>
        <div className='interview-section flex flex-row space-x-5'>
          {dummyInterviews.map((interview)=>(
              <InterviewCard {...interview} key={interview.id}/>
          ))}
        </div>
      </section>
    </>
  )
}

export default page