import './globals.css';
import type { Metadata, Viewport } from 'next';
export const metadata: Metadata = {title:'The Know Show | Brains on. Game on.',description:'An original, family-friendly live trivia show with everyone-answering trivia, category drafting, team turns and a final wager.',manifest:'/manifest.webmanifest',icons:{icon:'/app-icon-192.png',apple:'/app-icon-192.png'}};
export const viewport:Viewport={themeColor:'#142932',width:'device-width',initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="en"><body>{children}</body></html>;
}
