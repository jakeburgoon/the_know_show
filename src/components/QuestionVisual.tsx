'use client';
import {useState} from 'react';
import type {QuestionImage} from '@/lib/questions';
export default function QuestionVisual({image,compact=false}:{image?:QuestionImage;compact?:boolean}){
 return image?<Visual key={image.src} image={image} compact={compact}/>:null;
}
function Visual({image,compact}:{image:QuestionImage;compact:boolean}){
 const [failed,setFailed]=useState(false);
 return <figure className={'ks-question-visual'+(compact?' ks-question-visual--compact':'')}>
 {failed?<div className="ks-image-failure" role="status">Image unavailable. {image.alt} <small>Ask the host to skip the question if needed.</small></div>:<img src={image.src} alt={image.alt} width={image.width} height={image.height} loading="eager" decoding="async" draggable={false} onError={()=>setFailed(true)}/>}
 </figure>;
}
