import React from 'react'
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import {
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
  } from "@/components/ui/form";
  import { Input } from "@/components/ui/input";

interface FormFieledProps<T extends FieldValues>{
    control:Control<T>;
    name:Path<T>;
    lable:string;
    placeholder?:string;
    type?:"text"|"email"|"password"
}

const FormField = ({control,name,label,placeholder,type="text"}:FormFieledProps<T>) => {
    return (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="label">{label}</FormLabel>
              <FormControl>
                <Input
                  className="input"
                  type={type}
                  placeholder={placeholder}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
};

export default FormField