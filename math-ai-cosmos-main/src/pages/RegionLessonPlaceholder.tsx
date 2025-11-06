import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const RegionLessonPlaceholder: React.FC = () => {
	const { regionId } = useParams();
	const navigate = useNavigate();
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white p-6">
			<div className="max-w-lg w-full bg-white/10 border border-white/20 rounded-2xl p-8 backdrop-blur-sm text-center">
				<h1 className="text-2xl font-bold mb-2">Region Lesson Placeholder</h1>
				<p className="text-white/80 mb-6">Region: <span className="font-semibold">{regionId}</span></p>
				<p className="text-white/70 mb-8">Lessons for this region are coming soon. This placeholder is wired so clicking a subregion on the Philippines map navigates here.</p>
				<Button onClick={() => navigate(-1)} className="bg-gradient-to-r from-pink-500 to-violet-600">Back to Map</Button>
			</div>
		</div>
	);
};

export default RegionLessonPlaceholder;
