import { Routes, Route, Navigate } from 'react-router-dom';
import { TopicSelection } from '@/pages/teach-me/TopicSelection';
import { LessonGeneration } from '@/pages/teach-me/LessonGeneration';
import { LessonUnitsList } from '@/pages/teach-me/LessonUnitsList';
import { SessionSetup } from '@/pages/teach-me/SessionSetup';
import { LessonSession } from '@/pages/teach-me/LessonSession';
import { lazy } from 'react';

const ConcentrationMode = lazy(() => import('@/pages/teach-me/ConcentrationMode'));

export default function TeachMe() {
    return (
        <div className="h-full w-full bg-background-light dark:bg-background-dark">
            <Routes>
                {/* 1. Topic Selection (Entry Point) */}
                <Route path="/" element={<TopicSelection />} />
                <Route path="/topic" element={<TopicSelection />} />

                {/* 3. Generating (Loading) */}
                <Route path="/generating" element={<LessonGeneration />} />

                {/* 4. Units List */}
                <Route path="/class/:classId/units" element={<LessonUnitsList />} />
                <Route path="/class/units" element={<LessonUnitsList />} />

                {/* 5. Session Setup (Loading) */}
                <Route path="/session/setup" element={<SessionSetup />} />

                {/* 6. Live Session (Focused) */}
                <Route path="/session/:sessionId" element={<LessonSession />} />
                <Route path="/session/live" element={<LessonSession />} />

                {/* 7. Concentration Mode — Self-Study Quiz */}
                <Route path="/concentration/:lessonId" element={<ConcentrationMode />} />
                <Route path="/concentration" element={<ConcentrationMode />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/teach-me" replace />} />
            </Routes>
        </div>
    );
}
