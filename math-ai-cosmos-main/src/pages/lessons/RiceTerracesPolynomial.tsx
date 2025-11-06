import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, Target, Star } from 'lucide-react';
import riceTerraces from '@/assets/rice-terraces.jpg';



const RiceTerracesPolynomial: React.FC = () => {
	const navigate = useNavigate();
	const { awardXP, saveAchievement } = usePlayer();
	const { user } = useAuth();
	const [showContent, setShowContent] = useState(false);

	useEffect(() => {
		const t = setTimeout(() => setShowContent(true), 900);
		return () => clearTimeout(t);
	}, []);

	const handleContinueToChocolateHills = () => {
		// Award XP for completing the Rice Terraces lesson
		awardXP(200, 'rice-terraces-completed');
		
		// Save achievement
		if (user?.id) {
			saveAchievement({
				userId: user.id,
				lessonId: 'rice-terraces',
				lessonName: 'Rice Terraces: Polynomial Functions',
				lessonType: 'philippines-map',
				xpEarned: 200,
				locationName: 'Rice Terraces',
			});
		}
		
		navigate('/lesson/chocolate-hills');
	};

	return (
		<div className="min-h-screen relative overflow-hidden">
			
			
			{/* Animated Background */}
			<motion.div
				className="absolute inset-0"
				initial={{ scale: 1.15, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 1.2, ease: 'easeOut' }}
				style={{ backgroundImage: `url(${riceTerraces})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
			/>
			<div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

			{/* Content */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
				transition={{ duration: 0.6 }}
				className="relative z-10 container mx-auto px-6 py-10"
			>
				<div className="max-w-4xl mx-auto space-y-8">
					{/* Header Section */}
					<div className="bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md p-8 shadow-2xl">
						<h1 className="font-orbitron text-3xl md:text-4xl text-white mb-4 text-center">🌾 Rice Terraces: Polynomial Functions</h1>
						<p className="text-white/80 text-lg text-center mb-6">Like the orderly steps of the Banaue Rice Terraces, polynomial functions have structured, ordered terms.</p>
						
						<div className="grid md:grid-cols-2 gap-6">
							<div className="bg-black/40 border border-white/20 rounded-lg p-6">
								<h3 className="text-white font-semibold text-lg mb-3 flex items-center gap-2">
									<Target className="w-5 h-5 text-green-400" />
									Definition
								</h3>
								<p className="text-white/90">A polynomial is a sum of terms with variables raised to non‑negative integers.</p>
							</div>
							<div className="bg-black/40 border border-white/20 rounded-lg p-6">
								<h3 className="text-white font-semibold text-lg mb-3 flex items-center gap-2">
									<Star className="w-5 h-5 text-yellow-400" />
									Structure
								</h3>
								<p className="text-white/90">Ordered from highest degree to lowest, like terraces from top to bottom.</p>
							</div>
						</div>
					</div>

					{/* Example Section */}
					<div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-md rounded-2xl border-2 border-green-400/50 p-8 shadow-2xl">
						<h2 className="text-2xl font-orbitron font-bold text-white mb-6 text-center">📚 Polynomial Example</h2>
						<div className="bg-black/40 border border-green-400/30 rounded-xl p-6 text-center">
							<div className="text-3xl font-mono text-green-300 mb-4">h(x) = 2x³ - 3x² + x - 5</div>
							<div className="grid md:grid-cols-4 gap-4 text-sm">
								<div className="bg-white/10 rounded-lg p-3 border border-white/20">
									<div className="text-green-400 font-bold">Leading Term</div>
									<div className="text-white">2x³</div>
								</div>
								<div className="bg-white/10 rounded-lg p-3 border border-white/20">
									<div className="text-green-400 font-bold">Leading Coefficient</div>
									<div className="text-white">2</div>
								</div>
								<div className="bg-white/10 rounded-lg p-3 border border-white/20">
									<div className="text-green-400 font-bold">Degree</div>
									<div className="text-white">3</div>
								</div>
								<div className="bg-white/10 rounded-lg p-3 border border-white/20">
									<div className="text-green-400 font-bold">Constant Term</div>
									<div className="text-white">-5</div>
								</div>
							</div>
						</div>
					</div>



					{/* Action Buttons */}
					<div className="flex justify-center gap-4">
						<Button onClick={() => navigate(-1)} variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-3">
							← Back
						</Button>
						<Button onClick={handleContinueToChocolateHills} className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 px-8 py-3">
							Continue to Chocolate Hills →
						</Button>
						<Button onClick={() => navigate('/rpg')} variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-3">
							Finish Lesson
						</Button>
					</div>
				</div>
			</motion.div>
		</div>
	);
};

export default RiceTerracesPolynomial;
