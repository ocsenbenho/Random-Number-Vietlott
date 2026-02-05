import React, { useRef, useEffect, useState } from 'react';

const BALL_RADIUS = 18;

/**
 * Simplified Physics-based Lottery Ball Machine Simulation
 * Displays winning numbers with visual animation
 */
const LotteryMachine = ({
    numbers = [],
    min = 1,
    max = 45,
    pickCount = 6,
    onGenerate  // Callback to generate new numbers
}) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const ballsRef = useRef([]);
    const numbersRef = useRef(numbers);
    const [displayedBalls, setDisplayedBalls] = useState([]);
    const [isAnimating, setIsAnimating] = useState(false);

    // Keep numbersRef synchronized with numbers prop
    numbersRef.current = numbers;

    // Get a random vibrant color
    const getRandomColor = () => {
        const colors = [
            '#ef4444', '#f97316', '#eab308', '#22c55e',
            '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    // Initialize and animate balls
    const startAnimation = async () => {
        if (isAnimating) return;

        // Generate new numbers if callback provided
        if (onGenerate) {
            await onGenerate();
        }

        setIsAnimating(true);
        setDisplayedBalls([]);

        const range = max - min + 1;
        const newBalls = [];

        // Create all balls in the drum
        for (let i = 0; i < Math.min(range, 50); i++) { // Limit to 50 balls for performance
            newBalls.push({
                number: min + i,
                x: 50 + Math.random() * 300,
                y: 50 + Math.random() * 180,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: getRandomColor()
            });
        }

        ballsRef.current = newBalls;

        // Animate for 2 seconds, then show results
        let frameCount = 0;
        const maxFrames = 120; // ~2 seconds at 60fps

        const animate = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            // Clear
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, width, height);

            // Draw container
            ctx.strokeStyle = '#4a5568';
            ctx.lineWidth = 3;
            ctx.strokeRect(5, 5, width - 10, height - 60);

            // Update and draw balls
            ballsRef.current.forEach(ball => {
                // Physics
                ball.x += ball.vx;
                ball.y += ball.vy;
                ball.vy += 0.2; // Gravity
                ball.vx *= 0.99;
                ball.vy *= 0.99;

                // Add turbulence
                ball.vx += (Math.random() - 0.5) * 0.5;
                ball.vy += (Math.random() - 0.5) * 0.5;

                // Walls
                if (ball.x < BALL_RADIUS + 5) { ball.x = BALL_RADIUS + 5; ball.vx *= -0.7; }
                if (ball.x > width - BALL_RADIUS - 5) { ball.x = width - BALL_RADIUS - 5; ball.vx *= -0.7; }
                if (ball.y < BALL_RADIUS + 5) { ball.y = BALL_RADIUS + 5; ball.vy *= -0.7; }
                if (ball.y > height - BALL_RADIUS - 65) { ball.y = height - BALL_RADIUS - 65; ball.vy *= -0.7; }

                // Draw ball
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
                ctx.fillStyle = ball.color;
                ctx.fill();

                // Number
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(ball.number.toString().padStart(2, '0'), ball.x, ball.y);
            });

            // Status text
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Đang xáo trộn...', width / 2, height - 30);

            frameCount++;
            if (frameCount < maxFrames) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Animation complete, show results
                showResults();
            }
        };

        animate();
    };

    const showResults = () => {
        // Draw final state with picked numbers
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        // Draw container (empty now)
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 3;
        ctx.strokeRect(5, 5, width - 10, height - 60);

        // Draw winning numbers at bottom
        const displayNums = numbersRef.current.length > 0 ? numbersRef.current : [];
        const startX = (width - (displayNums.length * 45)) / 2 + 20;

        displayNums.forEach((num, idx) => {
            const x = startX + idx * 45;
            const y = height - 30;

            // Ball
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.fillStyle = '#fbbf24';
            ctx.fill();
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Number
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(num.toString().padStart(2, '0'), x, y);
        });

        // Title
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✨ Kết quả bộ số ✨', width / 2, 30);

        setDisplayedBalls(displayNums);
        setIsAnimating(false);
    };

    // Initial draw
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 3;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 60);

        ctx.fillStyle = '#888';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Nhấn nút để bắt đầu mô phỏng', canvas.width / 2, canvas.height / 2);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <div style={{ textAlign: 'center' }}>
            <canvas
                ref={canvasRef}
                width={400}
                height={280}
                style={{
                    border: '3px solid #4a5568',
                    borderRadius: '12px',
                    background: '#1a1a2e'
                }}
            />
            <div style={{ marginTop: '0.75rem' }}>
                {!isAnimating && (
                    <button
                        onClick={startAnimation}
                        style={{
                            padding: '0.6rem 1.5rem',
                            fontSize: '0.95rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        🎰 Chạy Mô phỏng
                    </button>
                )}
                {isAnimating && (
                    <span style={{ color: '#888' }}>Đang xáo trộn...</span>
                )}
            </div>
        </div>
    );
};

export default LotteryMachine;
