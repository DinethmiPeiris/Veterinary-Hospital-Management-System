import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status }) => {
    let statusClass = 'status-badge ';
    let label = status;

    switch (status) {
        case 'SCHEDULED':
            statusClass += 'status-scheduled';
            break;
        case 'IN_PROGRESS':
            statusClass += 'status-in-progress';
            label = 'IN PROGRESS';
            break;
        case 'COMPLETED':
            statusClass += 'status-completed';
            break;
        case 'CANCELLED':
            statusClass += 'status-cancelled';
            break;
        default:
            statusClass += 'status-default';
    }

    return (
        <span className={statusClass}>
            {label}
        </span>
    );
};

export default StatusBadge;
