import * as React from 'react';
import { Box, Typography, Chip, IconButton, LinearProgress, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import QuizIcon from '@mui/icons-material/Quiz';

// Import background images
import bg1 from '../../../assets/images/backgrounds/6.png'; // Blue
import bg2 from '../../../assets/images/backgrounds/2.png';
import bg3 from '../../../assets/images/backgrounds/3.png';
import bg4 from '../../../assets/images/backgrounds/4.png';
import bg5 from '../../../assets/images/backgrounds/5.png';
import bg6 from '../../../assets/images/backgrounds/1.png'; // Purple

const backgroundImages = [bg1, bg2, bg3, bg4, bg5, bg6];

// Difficulty levels
const difficultyLevels = ['Primary', 'Intermediate', 'Advanced', 'Master', 'Ph.D'];

export default function ExamCard({ exam, isCompleted = false }) {
  const { examName, duration, totalQuestions, examId } = exam;
  const { userInfo } = useSelector((state) => state.auth);
  const isTeacher = userInfo?.role === 'teacher';
  const [actualQuestionCount, setActualQuestionCount] = React.useState(totalQuestions);
  const [completionPercentage] = React.useState(Math.floor(Math.random() * 30) + 70); // Mock data

  const navigate = useNavigate();

  // Fetch actual question count
  React.useEffect(() => {
    const fetchQuestionCount = async () => {
      try {
        const response = await fetch(`/api/users/questions/exam/${examId}`, {
          credentials: 'include',
        });
        const questions = await response.json();
        setActualQuestionCount(questions.length);
      } catch (error) {
        console.error('Error fetching question count:', error);
      }
    };
    fetchQuestionCount();
  }, [examId]);

  const handleCardClick = () => {
    if (isTeacher) {
      toast.error('You are a teacher, you cannot take this exam');
      return;
    }
    if (isCompleted) {
      navigate('/result');
      return;
    }
    navigate(`/exam/${examId}`);
  };

  // Select background image and difficulty based on exam
  const bgIndex = examId ? examId.charCodeAt(0) % backgroundImages.length : 0;
  const difficultyIndex = actualQuestionCount ? Math.min(Math.floor(actualQuestionCount / 10), 4) : 0;
  const selectedBg = backgroundImages[bgIndex];

  return (
    <Box
      sx={{
        backgroundColor: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        height: '100%',
        minHeight: '420px',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 16px 32px rgba(0,0,0,0.18)',
        },
      }}
      onClick={handleCardClick}
    >
      {/* Background Image Header */}
      <Box
        sx={{
          height: '200px',
          backgroundImage: `url(${selectedBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          p: 2.5,
          filter: isCompleted ? 'grayscale(100%)' : 'none',
          opacity: isCompleted ? 0.92 : 1,
        }}
      >
        {/* Only show question count */}
        {actualQuestionCount > 0 && (
          <Chip
            label={actualQuestionCount}
            size="small"
            sx={{
              backgroundColor: '#E0F2FE',
              color: '#0369A1',
              fontWeight: 700,
              fontSize: '15px',
              height: '36px',
              boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
              minWidth: '45px',
              backdropFilter: 'blur(10px)',
            }}
          />
        )}
      </Box>

      {/* Card Content */}
      <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Exam Title */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: isCompleted ? '#64748b' : '#1e293b',
            mb: 1.5,
            fontSize: '20px',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '52px',
            letterSpacing: '-0.2px'
          }}
        >
          {examName}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            color: '#64748b',
            fontSize: '14px',
            mb: 2.5,
            fontWeight: 400,
          }}
        >
          Multiple choice questions exam
        </Typography>

        {/* Metadata Row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            mb: 3,
            color: '#64748b',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QuizIcon sx={{ fontSize: '20px' }} />
            <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 600 }}>
              {actualQuestionCount} Questions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ fontSize: '20px' }} />
            <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 600 }}>
              {duration} Minutes
            </Typography>
          </Box>
        </Box>

        {/* Status Section */}
        <Box sx={{ mt: 'auto' }}>
          {isCompleted ? (
            <Button
              size="small"
              sx={{
                color: '#3b82f6',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '15px',
                p: 0,
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/result');
              }}
            >
              View Analytics →
            </Button>
          ) : (
            <Button
              fullWidth={false}
              sx={{
                color: '#3b82f6',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '15px',
                p: 0,
                justifyContent: 'flex-start',
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                },
              }}
            >
              Start Test →
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
