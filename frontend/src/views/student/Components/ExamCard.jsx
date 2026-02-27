import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { CardActionArea, IconButton, Stack, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '../../teacher/components/DeleteIcon';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const imgUrl =
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGNvbXB1dGVyJTIwc2NpZW5jZXxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80';

export default function ExamCard({ exam, isCompleted = false }) {
  const { examName, duration, totalQuestions, examId, liveDate, deadDate } = exam;
  const { userInfo } = useSelector((state) => state.auth);
  const isTeacher = userInfo?.role === 'teacher';
  const [actualQuestionCount, setActualQuestionCount] = React.useState(totalQuestions);

  const navigate = useNavigate();
  const isExamActive = true;

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
      toast.info('You have already taken this exam');
      return;
    }
    if (isExamActive && !isTeacher) {
      navigate(`/exam/${examId}`);
    }
  };

  return (
    <Card>
      <CardActionArea onClick={handleCardClick}>
        <CardMedia 
          component="img" 
          height="140" 
          image={imgUrl} 
          alt="Exam"
          sx={{
            filter: isCompleted ? 'grayscale(100%)' : 'none',
          }}
        />
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography gutterBottom variant="h5" component="div">
              {examName}
            </Typography>
            {isTeacher && (
              <IconButton aria-label="delete">
                <DeleteIcon examId={examId} />
              </IconButton>
            )}
          </Stack>

          <Typography variant="body2" color="text.secondary">
            MCQ
          </Typography>

          <Stack direction="row" alignItems="center" justifyContent="space-between" mt={1}>
            <Typography variant="h6">{actualQuestionCount} ques</Typography>
            <Typography color="textSecondary">{duration}</Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
