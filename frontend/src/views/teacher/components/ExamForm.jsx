import React from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  OutlinedInput,
} from '@mui/material';
import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'All'];
const CLASSES = ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Graduate', 'All'];

const CreateExam = ({ formik, title, subtitle, subtext }) => {
  const { values, errors, touched, handleBlur, handleChange, handleSubmit, setFieldValue } = formik;

  return (
    <>
      {title ? (
        <Typography fontWeight="700" variant="h2" mb={1}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      <Box component="form">
        <Stack mb={3}>
          <CustomTextField
            id="examName"
            name="examName"
            label="Exam Name"
            variant="outlined"
            fullWidth
            value={values.examName}
            onChange={handleChange}
            error={touched.examName && Boolean(errors.examName)}
            helperText={touched.examName && errors.examName}
          />
        </Stack>

        <Stack mb={3}>
          <CustomTextField
            id="totalQuestions"
            name="totalQuestions"
            label="Total Number of Questions"
            variant="outlined"
            fullWidth
            value={values.totalQuestions}
            onChange={handleChange}
            error={touched.totalQuestions && Boolean(errors.totalQuestions)}
            helperText={touched.totalQuestions && errors.totalQuestions}
          />
        </Stack>

        <Stack mb={3}>
          <CustomTextField
            id="duration"
            name="duration"
            label="Exam Duration (minutes)"
            variant="outlined"
            fullWidth
            value={values.duration}
            onChange={handleChange}
            error={touched.duration && Boolean(errors.duration)}
            helperText={touched.duration && errors.duration}
          />
        </Stack>

        <Stack mb={3}>
          <FormControl fullWidth>
            <InputLabel id="departments-label">Allowed Departments</InputLabel>
            <Select
              labelId="departments-label"
              id="allowedDepartments"
              name="allowedDepartments"
              multiple
              value={values.allowedDepartments || ['All']}
              onChange={(e) => {
                const value = e.target.value;
                // If "All" is selected, only keep "All"
                if (value.includes('All') && !values.allowedDepartments?.includes('All')) {
                  setFieldValue('allowedDepartments', ['All']);
                } else if (value.includes('All')) {
                  // If "All" was already selected and user selects another, remove "All"
                  setFieldValue('allowedDepartments', value.filter(v => v !== 'All'));
                } else {
                  setFieldValue('allowedDepartments', value);
                }
              }}
              input={<OutlinedInput label="Allowed Departments" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {DEPARTMENTS.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack mb={3}>
          <FormControl fullWidth>
            <InputLabel id="classes-label">Allowed Classes</InputLabel>
            <Select
              labelId="classes-label"
              id="allowedClasses"
              name="allowedClasses"
              multiple
              value={values.allowedClasses || ['All']}
              onChange={(e) => {
                const value = e.target.value;
                // If "All" is selected, only keep "All"
                if (value.includes('All') && !values.allowedClasses?.includes('All')) {
                  setFieldValue('allowedClasses', ['All']);
                } else if (value.includes('All')) {
                  // If "All" was already selected and user selects another, remove "All"
                  setFieldValue('allowedClasses', value.filter(v => v !== 'All'));
                } else {
                  setFieldValue('allowedClasses', value);
                }
              }}
              input={<OutlinedInput label="Allowed Classes" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {CLASSES.map((cls) => (
                <MenuItem key={cls} value={cls}>
                  {cls}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack mb={3}>
          <CustomTextField
            id="liveDate"
            name="liveDate"
            label="Live Date and Time"
            type="datetime-local"
            variant="outlined"
            fullWidth
            value={values.liveDate}
            onChange={handleChange}
            error={touched.liveDate && Boolean(errors.liveDate)}
            helperText={touched.liveDate && errors.liveDate}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Stack>

        <Stack mb={3}>
          <CustomTextField
            id="deadDate"
            name="deadDate"
            label="Dead Date and Time"
            type="datetime-local"
            variant="outlined"
            fullWidth
            value={values.deadDate}
            onChange={handleChange}
            error={touched.deadDate && Boolean(errors.deadDate)}
            helperText={touched.deadDate && errors.deadDate}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Stack>

        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          type="submit"
          disabled={formik.isSubmitting}
          onClick={handleSubmit}
        >
          Create Exam
        </Button>
      </Box>

      {subtitle}
    </>
  );
};

export default CreateExam;
