"use client"
import { vapi } from '@/lib/vapi.sdk';
import clsx from 'clsx';
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

interface AgentProps {
  userName?: string;
  userId?: string;
  type: string;
}
enum CallStatus{
    INACTIVE="INACTIVE",
    CONNECTING="CONNECTING",
    ACTIVE="ACTIVE",
    FINISHED="FINISHED"
}
interface savedMessage{
    role:"user"|"system"|"assistant"
    content:string;

}
const Agent = ({userName,userId,type}:AgentProps) => {
  const router=useRouter()
  const[isSpeaking,setIsSpeaking]=useState(false)
  const[callStatus,setCallStatus]=useState<CallStatus>(CallStatus.INACTIVE)
  const [messages,setMessages]=useState<savedMessage[]>([])
  useEffect(()=>{
    const onCallStart=()=>setCallStatus(CallStatus.ACTIVE)
    const onCallEnd=()=>setCallStatus(CallStatus.FINISHED)
    const onMessage=(message:Message)=>{
        if (message.type==="transcript"&&message.transcriptType==="final"){
            const newMessage={role:message.role,content:message.transcript}
            setMessages((prev)=>[...prev,newMessage])
        }}
    const onSpeechStart=()=>setIsSpeaking(true)
    const onSpeechEnd=()=>setIsSpeaking(false)
    const onError=(error:Error)=>console.log("Error",error)
    vapi.on("call-start",onCallStart)
    vapi.on("call-end",onCallEnd)
    vapi.on("message",onMessage)
    vapi.on("speech-start",onSpeechStart)
    vapi.on("speech-end",onSpeechEnd)
    vapi.on("error",onError)
    return ()=>{
    vapi.off("call-start",onCallStart)
    vapi.off("call-end",onCallEnd)
    vapi.off("message",onMessage)
    vapi.off("speech-start",onSpeechStart)
    vapi.off("speech-end",onSpeechEnd)
    vapi.off("error",onError)
    }
  },[])
  useEffect(()=>{
    if(callStatus===CallStatus.FINISHED)router.push("/")
  },[messages,callStatus,type,userId])
const handleCall = async () => {
  try {
    setCallStatus(CallStatus.CONNECTING);

    // 1. 调用你自己的 API 生成面试题并写入 Firebase
    const res = await fetch("/api/vapi/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "Frontend Developer",
        level: "Junior",
        type: type, // 来自 props
        techstack: "React,TypeScript",
        amount: 5,
        userid: userId ?? "unknown",
      }),
    });

    const data = await res.json();

    if (!data.success || !data.interviewId) {
      throw new Error("Failed to generate interview");
    }

    // 2. 启动 Vapi 通话
    await vapi.start("b33e4730-803d-4411-b950-17199c4461c4", {
      variableValues: {
        username: userName ?? "Guest",
        userid: userId ?? "unknown",
        interviewId: data.interviewId, // 👈 带上刚刚生成的 interviewId
      },
      clientMessages: [],
      serverMessages: [],
    });

  } catch (error) {
    console.error("Call start failed:", error);
    setCallStatus(CallStatus.INACTIVE);
  }
};
    const handleDisconnect=async()=>{
    setCallStatus(CallStatus.FINISHED)
    vapi.stop()
  }
   const lastestMessage=messages[messages.length-1]?.content
   const isCallInactiveOrFinished=callStatus===CallStatus.INACTIVE||callStatus===CallStatus.FINISHED
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
        {messages.length>0&&(
            <div className='transcript-border'>
                <div className='transcript'>
                    <p key={lastestMessage} className={clsx("transition-opacity duration-500 opacity-0","animate-fadeIn-opacity-100")}>{lastestMessage}</p>
                </div>
            </div>
        )}
        <div className='w-full flex justify-center'>
            {callStatus!=="ACTIVE"?(
                <button className='relative btn-call' onClick={handleCall}>
                    <span className={clsx("absolute animate-ping rounded-full opacity-75",callStatus!=='CONNECTING'?"hidden":"")}/>
                    <span>{isCallInactiveOrFinished?"Call":"Connecting..."}</span>
                </button>
            ):(
                <button className='btn-disconnect' onClick={handleDisconnect}>
                    End
                </button>
            )}
        </div>
    </>
  )
}

export default Agent