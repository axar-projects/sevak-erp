
import { Suspense } from "react";
import Header from "@/components/layout/Header";
import AttendanceTable from "@/components/attendance/AttendanceTable";
import { getAttendanceReport } from "@/actions/attendance-actions";

export const dynamic = "force-dynamic";

export default async function AttendanceReportPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const dateParam = searchParams.date as string | undefined;
    const initialDate = dateParam || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD in IST

    // Fetch data
    const { success, data } = await getAttendanceReport(initialDate);
    const reportData = success ? data : [];

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Attendance Report</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        View and filter daily attendance records.
                    </p>
                </div>
                
                <Suspense fallback={<div className="text-center py-10">Loading report...</div>}>
                    <AttendanceTable 
                        initialDate={initialDate} 
                        reportData={reportData} 
                    />
                </Suspense>
            </main>
        </div>
    );
}
