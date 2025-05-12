'use server';

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

const ONE_WEEK=60*60*24*7;

export async function signUp(params:SignUpParams) {
    const {uid,name,email}=params;
    try{
        const userRecord=await db.collection("users").doc(uid).get();
        if(userRecord.exists){
            return{
                success:false,
                message:"user already exists"
            }
        }
        await db.collection("user").doc(uid).set({
            name,email
        })
    }catch(e:any){
        console.error("error creating a user",e)
        if(e.code==="auth/email-already-exists"){
            return{
                success:false,
                message:"This email is already in use"
            }
        }
        return{
            success:false,
            message:"failed to create an account"
        }
    }
}

export async function signIn(params:SignInParams){
    const{email,idToken}=params
    try{
        const userRecord=await auth.getUserByEmail(email)
        if(!userRecord){
            return{
                sucess:false,
                message:"user does not exist"
            }
        }
        await setSessionCookie(idToken)
    }catch(e){
        console.log(e);
        return{
            success:false,
            message:"failed to log"
        }
    }
}

export async function setSessionCookie(idToken:string) {
    const cookieStore=await cookies();
    const sessionCookie=await auth.createSessionCookie(idToken,{
        expiresIn:ONE_WEEK*1000,
    })

    cookieStore.set("session",sessionCookie),{
        maxAge:ONE_WEEK,
        httpOnly:true,
        secure:process.env.NODE_ENV==="production",
        path:"/",
        sameSite:"lax"
    }
}