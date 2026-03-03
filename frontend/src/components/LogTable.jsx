import React from 'react';

const LogTable = ({ logs }) => {
    return (
        <table>
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Method</th>
                    <th>URL</th>
                    <th>Status</th>
                    <th>Risk Level</th>
                    <th>Score</th>
                    <th>Reasons</th>
                </tr>
            </thead>
            <tbody>
                {logs.map((log, index) => (
                    <tr key={index}>
                        <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td>{log.method}</td>
                        <td title={log.url}>
                            {log.url.length > 50 ? log.url.substring(0, 50) + '...' : log.url}
                        </td>
                        <td>{log.status_code}</td>
                        <td>
                            <span className={`badge ${log.risk_level.toLowerCase()}`}>
                                {log.risk_level}
                            </span>
                        </td>
                        <td>{log.risk_score}</td>
                        <td style={{ fontSize: '0.85em', color: '#666' }}>
                            {log.reasons && log.reasons.join(", ")}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default LogTable;
