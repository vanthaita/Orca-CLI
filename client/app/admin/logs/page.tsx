'use client';

import { useAdminLogs } from '@/hook/useAdminLogs';
import { useState } from 'react';

export default function LogsPage() {
    const [logLines, setLogLines] = useState(100);
    const { data: logs, isLoading: logsLoading, error: logsError } = useAdminLogs(logLines);

    return (
        <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                    System Logs
                </h1>

                <div className="flex items-center gap-3 bg-black/40 border border-dashed border-white/10 rounded-lg p-1">
                    {[50, 100, 200, 500].map(count => (
                        <button
                            key={count}
                            onClick={() => setLogLines(count)}
                            className={`px-3 py-1.5 text-xs font-bold transition-all rounded ${logLines === count
                                ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                : 'text-neutral-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {count}
                        </button>
                    ))}
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <div className="px-2 text-[10px] text-emerald-400 font-mono uppercase animate-pulse">
                        ● LIVE
                    </div>
                </div>
            </div>

            <div className="flex-1 border border-dashed border-white/20 bg-[#050505] rounded-xl overflow-hidden flex flex-col relative group">
                <div className="bg-white/5 border-b border-dashed border-white/10 px-4 py-2 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                    <div className="ml-2 text-xs font-mono text-neutral-500">orca-server.log</div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 custom-scrollbar">
                    {logsLoading && (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            <div className="text-neutral-500">Connecting to log stream...</div>
                        </div>
                    )}

                    {logsError && (
                        <div className="text-red-400 p-4 border border-red-500/20 bg-red-500/5 rounded">
                            CONNECTION EROE: {(logsError as any)?.message || 'Failed to fetch logs'}
                        </div>
                    )}

                    {logs?.map((log, idx) => (
                        <div key={idx} className="flex gap-3 hover:bg-white/5 p-1 -mx-1 rounded transition-colors break-words">
                            <div className="w-20 text-neutral-600 shrink-0 select-none">
                                {log.time ? new Date(log.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                            </div>

                            <div className="shrink-0 w-16">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${(log.level ?? 30) >= 50
                                        ? 'bg-red-500 text-white'
                                        : (log.level ?? 30) >= 40
                                            ? 'bg-yellow-500 text-black'
                                            : 'text-emerald-500 border border-emerald-500/30'
                                    }`}>
                                    {(log.level ?? 30) >= 50 ? 'ERR' : (log.level ?? 30) >= 40 ? 'WRN' : 'INF'}
                                </span>
                            </div>

                            <div className="flex-1 text-neutral-300">
                                {log.context && <span className="text-purple-400 mr-2">[{log.context}]</span>}
                                {log.msg}
                                {log.req && (
                                    <div className="mt-1 ml-4 p-2 bg-white/5 rounded border-l-2 border-white/10 text-neutral-500">
                                        <div className="flex gap-2">
                                            <span className="text-blue-400 font-bold">{log.req.method}</span>
                                            <span className="text-neutral-300">{log.req.url}</span>
                                        </div>
                                        <div className="mt-1 flex gap-2 text-[10px]">
                                            <span>Res: <span className={log.res?.statusCode >= 400 ? 'text-red-400' : 'text-green-400'}>{log.res?.statusCode}</span></span>
                                            <span>•</span>
                                            <span>Time: {log.responseTime}ms</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {logs?.length === 0 && !logsLoading && (
                        <div className="text-neutral-600 italic opacity-50 text-center mt-20">No logs available in the current buffer.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
