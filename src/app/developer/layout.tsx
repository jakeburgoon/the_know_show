import type {Metadata} from 'next';
import type {ReactNode} from 'react';
export const metadata:Metadata={title:'Developer feedback | The Know Show',robots:{index:false,follow:false}};
export default function DeveloperLayout({children}:{children:ReactNode}){return <>{children}</>;}
