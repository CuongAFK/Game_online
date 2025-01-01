import React from 'react';
import { FaPalette } from 'react-icons/fa';

const themes = [
    'gameTheme',
    'light',
    'dark',
    'cupcake',
    'cyberpunk',
    'retro',
    'valentine',
    'garden'
];

const ThemeSwitcher = () => {
    const [isOpen, setIsOpen] = React.useState(false);

    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        setIsOpen(false);
    };

    React.useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'gameTheme';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    return (
        <div className="dropdown dropdown-end">
            <div 
                tabIndex={0} 
                role="button" 
                onClick={() => setIsOpen(!isOpen)}
                className="btn btn-ghost btn-circle"
            >
                <FaPalette size={20} />
            </div>
            {isOpen && (
                <ul 
                    tabIndex={0} 
                    className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-200 rounded-box w-52"
                >
                    {themes.map((theme) => (
                        <li key={theme}>
                            <button
                                onClick={() => setTheme(theme)}
                                className="btn btn-ghost justify-start capitalize"
                            >
                                {theme.replace(/([A-Z])/g, ' $1').trim()}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ThemeSwitcher;
