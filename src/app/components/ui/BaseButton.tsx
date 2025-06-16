import React from 'react';
import '../../styles/ui/BaseButton.scss';
type BaseButtonProps = {
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    className?: string;
    children: React.ReactNode;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean; // Add this line
    form?: string; 
};

const BaseButton: React.FC<BaseButtonProps> = ({
    onClick,
    className,
    children,
    type = 'button',
    disabled = false, // Default to false
    form = undefined,
}) => {
    const buttonClass = className ? className : 'BaseButton';

    return (
        <button type={type} onClick={onClick} className={buttonClass} form={form} disabled={disabled}>
            {children}
        </button>
    );
};

export default BaseButton;