// frontend/src/pages/DebugHealthPage.tsx
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { apiClient } from '../config/api';

type HealthStatus = 'ok' | 'error' | string;

interface HealthResponse {
    status: HealthStatus;
    checks?: Record<string, string>;
    meta?: Record<string, unknown>;
}

type ViewState = 'idle' | 'loading' | 'success' | 'error';

function getStatusColors(status: HealthStatus): { background: string; color: string } {
    if (status === 'ok') {
        return { background: 'rgba(22, 163, 74, 0.15)', color: '#16a34a' }; // green
    }
    if (status === 'error') {
        return { background: 'rgba(220, 38, 38, 0.15)', color: '#dc2626' }; // red
    }
    return { background: 'rgba(148, 163, 184, 0.15)', color: '#e5e7eb' }; // gray
}

function StatusBadge({ status }: { status: HealthStatus }) {
    const { background, color } = getStatusColors(status);

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.15rem 0.6rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 500,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                backgroundColor: background,
                color,
            }}
        >
            {status}
        </span>
    );
}

function DebugHealthPage() {
    const [state, setState] = useState<ViewState>('idle');
    const [data, setData] = useState<HealthResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadHealth = async () => {
        setState('loading');
        setError(null);

        try {
            const response = await apiClient.get<HealthResponse>('/health', {
                // /health uses 503 when dependencies are down but still returns
                // a valid JSON payload that we want to display.
                acceptErrorStatuses: [503],
            });
            setData(response);
            setState('success');
        } catch (err) {
            console.error('[DebugHealthPage] Error fetching /health', err);
            setData(null);
            setState('error');
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    useEffect(() => {
        void loadHealth();
    }, []);

    const hasData = state === 'success' && data;

    return (
        <section>
            <header style={{ marginBottom: '1.5rem' }}>
                <h1>Debug health</h1>
                <p>
                    This page calls the backend <code>/health</code> endpoint and shows
                    the status of core dependencies such as the database and the queue.
                </p>
                <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>
                    During Phase 0 it is expected that the health status may be{' '}
                    <code>error</code> when PostgreSQL or Redis are not running. The goal
                    here is to verify that the wiring between frontend and backend works
                    correctly.
                </p>
                <button
                    type="button"
                    onClick={() => void loadHealth()}
                    style={{
                        marginTop: '1rem',
                        padding: '0.4rem 0.9rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(148, 163, 184, 0.4)',
                        background: 'transparent',
                        color: '#e5e7eb',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                    }}
                >
                    Refresh status
                </button>
            </header>

            {state === 'loading' && (
                <p style={{ fontStyle: 'italic' }}>Loading health status…</p>
            )}

            {state === 'error' && (
                <div style={{ marginTop: '1rem' }}>
                    <p style={{ color: '#f97316', fontWeight: 500 }}>
                        Could not reach the backend health endpoint.
                    </p>
                    {error && (
                        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                            Technical details: {error}
                        </p>
                    )}
                </div>
            )}

            {hasData && data && (
                <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1rem' }}>
                    <section>
                        <h2>Overall status</h2>
                        <p>
                            Global health status as reported by the backend:
                            {' '}
                            <StatusBadge status={data.status} />
                        </p>
                    </section>

                    <section>
                        <h2>Checks</h2>
                        {data.checks && Object.keys(data.checks).length > 0 ? (
                            <table
                                style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '0.9rem',
                                }}
                            >
                                <thead>
                                    <tr>
                                        <th
                                            style={{
                                                textAlign: 'left',
                                                padding: '0.4rem 0.3rem',
                                                borderBottom: '1px solid rgba(148, 163, 184, 0.4)',
                                            }}
                                        >
                                            Component
                                        </th>
                                        <th
                                            style={{
                                                textAlign: 'left',
                                                padding: '0.4rem 0.3rem',
                                                borderBottom: '1px solid rgba(148, 163, 184, 0.4)',
                                            }}
                                        >
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(data.checks).map(([key, value]) => (
                                        <tr key={key}>
                                            <td
                                                style={{
                                                    padding: '0.35rem 0.3rem',
                                                    borderBottom:
                                                        '1px solid rgba(31, 41, 55, 0.35)',
                                                }}
                                            >
                                                <code>{key}</code>
                                            </td>
                                            <td
                                                style={{
                                                    padding: '0.35rem 0.3rem',
                                                    borderBottom:
                                                        '1px solid rgba(31, 41, 55, 0.35)',
                                                }}
                                            >
                                                <StatusBadge status={value} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ fontStyle: 'italic', opacity: 0.8 }}>
                                The backend did not return any detailed checks.
                            </p>
                        )}
                    </section>

                    <section>
                        <h2>Raw payload</h2>
                        <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                            This is the raw JSON payload returned by the backend. It is useful
                            for debugging changes in the health contract.
                        </p>
                        <pre
                            style={{
                                marginTop: '0.5rem',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                fontSize: '0.8rem',
                                overflowX: 'auto',
                            }}
                        >
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </section>
                </div>
            )}
        </section>
    );
}

export default DebugHealthPage;
