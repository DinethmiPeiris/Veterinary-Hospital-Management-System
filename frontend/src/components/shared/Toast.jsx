import React, { useState, useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible && !message) return null;

    const icons = { success: '✅', error: '❌', warning: '⚠️' };
    const icon = icons[type] || icons.success;

    return (
        <div className={`toast toast-${type} ${isVisible ? 'toast-visible' : 'toast-hidden'}`}>
            <span className="toast-icon">{icon}</span>
            <span className="toast-message">{message}</span>
            <button className="toast-close" onClick={() => setIsVisible(false)}>&times;</button>
        </div>
    );
};

export default Toast;
