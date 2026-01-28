"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AttendanceRecord {
    _id: string;
    userId: {
        _id: string;
        name: string;
        gaam: string;
        seva: string;
        mobileNumber: string;
    } | null;
    date: string;
    status: string;
    createdAt: string;
}

interface AttendanceTableProps {
    initialDate: string;
    reportData: AttendanceRecord[];
}

export default function AttendanceTable({ initialDate, reportData }: AttendanceTableProps) {
    const router = useRouter();
    const [date, setDate] = useState(initialDate);
    const [isLoading, setIsLoading] = useState(false);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setDate(newDate);
        setIsLoading(true);
        router.push(`/attendance/report?date=${newDate}`);
    };

    // Reset loading state when data updates
    useEffect(() => {
        setIsLoading(false);
    }, [initialDate, reportData]);

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-700">Attendance Records</h2>
                <div className="flex items-center gap-2">
                    <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">Filter Date:</label>
                    <input 
                        type="date" 
                        id="date-filter"
                        value={date} 
                        onChange={handleDateChange}
                        className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sevak Name</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Gaam</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Seva</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                    No attendance records found for this date.
                                </td>
                            </tr>
                        ) : (
                            reportData.map((record, index) => (
                                <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {reportData.length - index}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs mr-3">
                                                {record.userId?.name.charAt(0) || "?"}
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {record.userId?.name || "Unknown User"}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {record.userId?.gaam || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {record.userId?.seva || "-"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {record.userId?.mobileNumber || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            record.status === 'present' ? 'bg-green-100 text-green-800' : 
                                            record.status === 'late' ? 'bg-yellow-100 text-yellow-800' : 
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {isLoading && (
                <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}
        </div>
    );
}
