import type { ReactNode } from 'react';
import { Header } from './Header';

interface AppLayoutProps {
    children: ReactNode;
    hideHeader?: boolean;
}

export function AppLayout({ children, hideHeader = false }: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
            {!hideHeader && <Header />}
            <main className="flex-1">{children}</main>
        </div>
    );
}
