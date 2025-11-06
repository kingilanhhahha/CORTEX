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
			<div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/60" />

			{/* Content */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
				transition={{ duration: 0.6 }}
				className="relative z-10 container mx-auto px-6 py-10"
			>
				<div className="max-w-4xl mx-auto space-y-8">
					{/* Header Section */}
					<div className="bg-gradient-to-br from-green-600/50 to-emerald-600/50 border-2 border-green-400/60 rounded-2xl backdrop-blur-lg p-8 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
						<div className="bg-black/25 rounded-xl p-6 -m-2 border border-white/10">
							<h1 className="font-orbitron text-3xl md:text-4xl text-white mb-4 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] font-bold">🌾 Rice Terraces: Polynomial Functions</h1>
							<p className="text-white text-lg text-center mb-6 drop-shadow-lg font-medium">Like the orderly steps of the Banaue Rice Terraces, polynomial functions have structured, ordered terms.</p>
							
							<div className="grid md:grid-cols-2 gap-6">
								<div className="bg-gradient-to-br from-green-500/40 to-emerald-500/40 border-2 border-green-400/50 rounded-lg p-6 shadow-[0_0_20px_rgba(34,197,94,0.3)] backdrop-blur-sm">
									<h3 className="text-white font-semibold text-lg mb-3 flex items-center gap-2 drop-shadow-md">
										<Target className="w-5 h-5 text-green-300 drop-shadow-[0_0_8px_rgba(134,239,172,0.8)]" />
										Definition
									</h3>
									<p className="text-white font-medium drop-shadow-md">A polynomial is a sum of terms with variables raised to non‑negative integers.</p>
								</div>
								<div className="bg-gradient-to-br from-yellow-500/40 to-amber-500/40 border-2 border-yellow-400/50 rounded-lg p-6 shadow-[0_0_20px_rgba(234,179,8,0.3)] backdrop-blur-sm">
									<h3 className="text-white font-semibold text-lg mb-3 flex items-center gap-2 drop-shadow-md">
										<Star className="w-5 h-5 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />
										Structure
									</h3>
									<p className="text-white font-medium drop-shadow-md">Ordered from highest degree to lowest, like terraces from top to bottom.</p>
								</div>
							</div>
						</div>
					</div>

					{/* Example Section */}
					<div className="bg-gradient-to-r from-green-600/55 to-emerald-600/55 backdrop-blur-lg rounded-2xl border-2 border-green-400/60 p-8 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
						<div className="bg-black/25 rounded-xl p-6 -m-2 border border-white/10">
							<h2 className="text-2xl font-orbitron font-bold text-white mb-6 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">📚 Polynomial Example</h2>
							<div className="bg-gradient-to-br from-green-500/40 to-emerald-500/40 border-2 border-green-400/50 rounded-xl p-6 text-center shadow-[0_0_20px_rgba(34,197,94,0.3)] backdrop-blur-sm">
								<div className="bg-black/30 rounded-lg p-4 mb-4 border border-green-300/30">
									<div className="text-3xl font-mono text-green-200 mb-4 drop-shadow-[0_0_10px_rgba(134,239,172,0.6)] font-bold">h(x) = 2x³ - 3x² + x - 5</div>
								</div>
								<div className="grid md:grid-cols-4 gap-4 text-sm">
									<div className="bg-gradient-to-br from-green-500/50 to-emerald-500/50 rounded-lg p-4 border-2 border-green-300/50 shadow-[0_0_15px_rgba(34,197,94,0.3)] backdrop-blur-sm">
										<div className="text-green-200 font-bold mb-2 drop-shadow-md">Leading Term</div>
										<div className="text-white font-semibold text-lg drop-shadow-md">2x³</div>
									</div>
									<div className="bg-gradient-to-br from-green-500/50 to-emerald-500/50 rounded-lg p-4 border-2 border-green-300/50 shadow-[0_0_15px_rgba(34,197,94,0.3)] backdrop-blur-sm">
										<div className="text-green-200 font-bold mb-2 drop-shadow-md">Leading Coefficient</div>
										<div className="text-white font-semibold text-lg drop-shadow-md">2</div>
									</div>
									<div className="bg-gradient-to-br from-green-500/50 to-emerald-500/50 rounded-lg p-4 border-2 border-green-300/50 shadow-[0_0_15px_rgba(34,197,94,0.3)] backdrop-blur-sm">
										<div className="text-green-200 font-bold mb-2 drop-shadow-md">Degree</div>
										<div className="text-white font-semibold text-lg drop-shadow-md">3</div>
									</div>
									<div className="bg-gradient-to-br from-green-500/50 to-emerald-500/50 rounded-lg p-4 border-2 border-green-300/50 shadow-[0_0_15px_rgba(34,197,94,0.3)] backdrop-blur-sm">
										<div className="text-green-200 font-bold mb-2 drop-shadow-md">Constant Term</div>
										<div className="text-white font-semibold text-lg drop-shadow-md">-5</div>
									</div>
								</div>
							</div>
						</div>
					</div>



					{/* Action Buttons */}
					<div className="flex justify-center gap-4 flex-wrap">
						<Button onClick={() => navigate(-1)} variant="outline" className="border-2 border-white/40 text-white hover:bg-white/20 backdrop-blur-sm bg-black/30 px-8 py-3 drop-shadow-lg hover:border-white/60 transition-all">
							← Back
						</Button>
						<Button onClick={handleContinueToChocolateHills} className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 px-8 py-3 shadow-[0_0_20px_rgba(234,179,8,0.5)] hover:shadow-[0_0_30px_rgba(234,179,8,0.7)] transition-all drop-shadow-lg font-semibold">
							Continue to Chocolate Hills →
						</Button>
						<Button onClick={() => navigate('/rpg')} variant="outline" className="border-2 border-white/40 text-white hover:bg-white/20 backdrop-blur-sm bg-black/30 px-8 py-3 drop-shadow-lg hover:border-white/60 transition-all">
							Finish Lesson
						</Button>
					</div>
				</div>
			</motion.div>
		</div>
	);
};

export default RiceTerracesPolynomial;
