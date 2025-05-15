import clsx from 'clsx';
import Image from 'next/image'
import React from 'react'
enum CallStatus{
    INACTIVE="INACTIVE",
    CONNECTING="CONNECTING",
    ACTIVE="ACTIVE",
    FINISHED="FINISHED"
}



const Agent = ({userName}:AgentProps) => {
  const callStatus=CallStatus.CONNECTING
  const isSpeaking=true;
  const message=[
    "what's your name?",
    "My name is"
  ]
  const lastMessage=message[message.length-1]
  return (
    <>
        <div className='call-view'>
            <div className='card-interviewer'>
                <div className='avatar'>
                    <Image src="/ai-avatar.png" alt='vapi' width={65} height={54} className='object-cover'/>
                    {isSpeaking && <span className="animate-speak" />}
                </div>
                <h3>AI interviewer</h3>
            </div>
            <div className='card-border'>
                <div className='card-content'>
                    <Image src="/user-avatar.png" alt='user-avatar' width={540} height={540} className='rounded-full object-cover size-[120px]'/>
                    <h3>{userName}</h3>
                </div>
            </div>
        </div>
        {message.length>0&&(
            <div className='transcript-border'>
                <div className='transcript'>
                    <p key={lastMessage} className={clsx("transition-opacity duration-500 opacity-0","animate-fadeIn-opacity-100")}>{lastMessage}</p>
                </div>
            </div>
        )}
        <div className='w-full flex justify-center'>
            {callStatus!=="ACTIVE"?(
                <button className='relative btn-call'>
                    <span className={clsx("absolute animate-ping rounded-full opacity-75",callStatus!=='CONNECTING'?"hidden":"")}/>
                    <span>{callStatus === "INACTIVE" || callStatus === "FINISHED"?"Call:'...'":"Connecting..."}</span>
                </button>
            ):(
                <button className='btn-disconnect'>
                    End
                </button>
            )}
        </div>
    </>
  )
}

export default Agent