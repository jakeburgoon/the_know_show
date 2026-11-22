import './globals.css';
import type { Metadata, Viewport } from 'next';
export const metadata: Metadata = {title:'The Know Show | Brains on. Game on.',description:'An original, family-friendly live trivia show with phone buzzing, category drafting and a final wager.',manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg'}};
export const viewport:Viewport={themeColor:'#142932',width:'device-width',initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="en"><body>{children}</body></html>;
}
