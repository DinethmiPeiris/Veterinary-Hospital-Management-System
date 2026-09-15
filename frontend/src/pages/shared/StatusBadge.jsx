import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status }) => {
    let statusClass = 'status-badge ';
    let statusLabel = status;

    switch (status?.toUpperCase()) {
        case 'SCHEDULED':
            statusClass += 'status-scheduled';
            statusLabel = 'Scheduled';
            break;
        case 'WAITING':
            statusClass += 'status-waiting';
            statusLabel = 'Waiting';
            break;
        case 'IN_PROGRESS':
            statusClass += 'status-in-progress';
            statusLabel = 'In Progress';
            break;
        case 'COMPLETED':
            statusClass += 'status-completed';
            statusLabel = 'Completed';
            break;
        case 'CANCELLED':
            statusClass += 'status-cancelled';
            statusLabel = 'Cancelled';
            break;
        default:
            statusClass += 'status-default';
    }

    return (
        <span className={statusClass}>
            {statusLabel}
        </span>
    );
};

export default StatusBadge;
