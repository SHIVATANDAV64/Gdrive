
import {
    useState,
    useEffect,
    type ReactNode
} from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppActions } from '@/hooks/useAppActions';


interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { searchQuery, setSearchQuery } = useAppActions();

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarCollapsed(true);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    return (
        <div className="flex bg-[var(--color-background)] h-screen overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={toggleSidebar}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                <Header
                    onSearch={setSearchQuery}
                />

                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 pb-20">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default MainLayout;
