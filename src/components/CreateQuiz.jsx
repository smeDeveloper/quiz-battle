import React, { useEffect, useRef, useState } from 'react'
import { AlignVerticalJustifyEnd, ChevronLeft, Copy, Edit, Link2, Lock, Trash2, X } from 'lucide-react';
import { useUserContext } from '../contexts/user';
import { usePopUpContext } from '../contexts/Popup';
import { useNavigate } from 'react-router-dom';
import { usePreviewContext } from '../contexts/Preview';
import { useLoaderContext } from '../contexts/loader';
import { useQuizzesContext } from '../contexts/Quizzes';
import isArabic from 'is-arabic';
import copy from 'copy-to-clipboard';

const CreateQuiz = () => {
  const navigate = useNavigate();

  const [switchOn, setSwitchOn] = useState(localStorage.getItem("auto save") === "on" ? true : (!localStorage.getItem("auto save") ? true : false));
  const [questions, setQuestions] = useState(switchOn ? (localStorage.getItem("questions") ? JSON.parse(localStorage.getItem("questions")) : []) : []);
  const [teacherData, setTeacherData] = useState(localStorage.getItem("teacher data") ? JSON.parse(localStorage.getItem("teacher data")) : { gender: "", category: "", });
  const [description, setDescription] = useState(localStorage.getItem("description") || "");
  const [showConfirmMessage, setShowConfirmMessage] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [isUpdating, setIsUpdating] = useState(-1);

  const { userInfo } = useUserContext();
  const { setMessageContent , setCopyLink } = usePopUpContext();
  const { setPreviewQuestions } = usePreviewContext();
  const { setIsLoading } = useLoaderContext();
  const { setQuizzes } = useQuizzesContext();

  const questionInput = useRef();
  const correctAnswer = useRef();
  const wrongAnswer1 = useRef();
  const wrongAnswer2 = useRef();
  const wrongAnswer3 = useRef();
  const questionsContainer = useRef();
  const descriptionInput = useRef();

  const emptyInputs = () => {
    questionInput.current.value = "";
    correctAnswer.current.value = "";
    wrongAnswer1.current.value = "";
    wrongAnswer2.current.value = "";
    wrongAnswer3.current.value = "";
    questionInput.current.dir = "ltr";
    correctAnswer.current.dir = "ltr";
    wrongAnswer1.current.dir = "ltr";
    wrongAnswer2.current.dir = "ltr";
    wrongAnswer3.current.dir = "ltr";
  }

  useEffect(() => {
    if (userInfo.role === "student") {
      setIsStudent(true);
    } else {
      setIsStudent(false);
      setTeacherData({ gender: teacherData.gender === "" ? (!userInfo.username ? "" : "Mr." + userInfo.username) : teacherData.gender, category: teacherData.category === "" ? "Arabic" : teacherData.category, })
    }
  }, [userInfo])

  const addQuestion = () => {
    if (questionInput.current && correctAnswer.current && wrongAnswer1.current && wrongAnswer2.current && wrongAnswer3.current) {
      if (questionInput.current.value.trim() && correctAnswer.current.value.trim() && wrongAnswer1.current.value.trim() && wrongAnswer2.current.value.trim() && wrongAnswer3.current.value.trim()) {
        const values = [correctAnswer.current.value.trim(), wrongAnswer1.current.value.trim(), wrongAnswer2.current.value.trim(), wrongAnswer3.current.value.trim()];
        let haveDublicates = false;
        for (let i = 0; i < values.length; i++) {
          for (let j = 0; j < values.length; j++) {
            if (i !== j && values[i] === values[j]) {
              haveDublicates = true;
            }
          }
        }
        if (haveDublicates) {
          setMessageContent({
            title: "Found Duplicates",
            message: "Two or more inputs have the same value. Please change them so all inputs are unique.",
          });
        } else {
          const questionData = {
            question: questionInput.current.value,
            answers: [correctAnswer.current.value, wrongAnswer1.current.value, wrongAnswer2.current.value, wrongAnswer3.current.value],
            correctAnswer: correctAnswer.current.value,
          };
          setQuestions(prev => ([
            ...prev, questionData
          ]))
          emptyInputs();
          if (switchOn) {
            localStorage.setItem("questions", JSON.stringify([...questions, questionData]));
          }
        }
      } else {
        setMessageContent({
          title: "Missing Field(s)",
          message: "All fields are required for adding your question.",
        })
      }
    }
  }

  useEffect(() => {
    if (isUpdating !== -1) {
      const question = questions[isUpdating];
      questionInput.current.value = question.question;
      correctAnswer.current.value = question.answers[0];
      wrongAnswer1.current.value = question.answers[1];
      wrongAnswer2.current.value = question.answers[2];
      wrongAnswer3.current.value = question.answers[3];
    }
  }, [isUpdating])

  const updateQuestion = () => {
    if (questionInput.current && correctAnswer.current && wrongAnswer1.current && wrongAnswer2.current && wrongAnswer3.current) {
      if (questionInput.current.value.trim() && correctAnswer.current.value.trim() && wrongAnswer1.current.value.trim() && wrongAnswer2.current.value.trim() && wrongAnswer3.current.value.trim()) {
        const values = [correctAnswer.current.value.trim(), wrongAnswer1.current.value.trim(), wrongAnswer2.current.value.trim(), wrongAnswer3.current.value.trim()];
        let haveDublicates = false;
        for (let i = 0; i < values.length; i++) {
          for (let j = 0; j < values.length; j++) {
            if (i !== j && values[i] === values[j]) {
              haveDublicates = true;
            }
          }
        }
        if (haveDublicates) {
          setMessageContent({
            title: "Found Duplicates",
            message: "Two or more inputs have the same value. Please change them so all inputs are unique.",
          });
        } else {
          const questionData = {
            question: questionInput.current.value,
            answers: [correctAnswer.current.value, wrongAnswer1.current.value, wrongAnswer2.current.value, wrongAnswer3.current.value],
            correctAnswer: correctAnswer.current.value,
          };
          const newQuestions = questions.map((question, i) => {
            if (i === isUpdating) {
              return questionData;
            } else {
              return question;
            }
          })
          setQuestions(newQuestions);
          if (switchOn) {
            localStorage.setItem("questions", JSON.stringify(newQuestions));
          }
          setIsUpdating(-1);
          emptyInputs();
        }
      } else {
        setMessageContent({
          title: "Missing Field(s)",
          message: "All fields are required for adding your question.",
        })
      }
    }
  }

  const deleteQuestion = (i) => {
    const newQuestions = [...questions];
    newQuestions.splice(i, 1);
    setQuestions(newQuestions);
    if (switchOn) {
      localStorage.setItem("questions", JSON.stringify(newQuestions))
    }
  }

  const publishQuiz = () => {
    const quiz = {
      category: teacherData.category,
      from_id: userInfo.id,
      from_name: teacherData.gender,
      questions: questions,
      description: descriptionInput.current.value,
    };

    if (questions.length > 2) {
      setIsLoading(prev => prev + 1);
      fetch("http://localhost:3001/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quiz),
      }).then(res => res.json())
        .then(data => {
          if (data.saved) {
            quiz._id = data.id;
            setMessageContent({ title: "Quiz Published", message: "Quiz Published Successfully.", })
            setCopyLink(window.location.origin + "/info/" + data.id);
            localStorage.removeItem("questions");
            setQuizzes(prev => ([quiz, ...prev]));
            setPreviewQuestions([]);
            navigate("/home");
            localStorage.removeItem("description");
          } else {
            setMessageContent({ title: "Publishing Failed", message: data.msg, })
          }
          setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
        }).catch(err => {
          console.log(err);
          setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

          setMessageContent({ title: "Quiz Creation Error", message: "Oops! something went wrong while publishing your quiz.", })
        })
    } else {
      setMessageContent({ title: "Questions Number Error", message: "Sorry, your quiz must contain at least 3 questions.", })
    }
  }

  return (
    <div className="create_quiz_container">
      <header>
        <ChevronLeft onClick={() => navigate("/home")} size={24} />
        <p>Create Quiz</p>
      </header>
      {!isStudent ?
        <>
          <div className="auto_save_questions">
            <p>Auto Save Questions</p>
            <div onClick={() => { setSwitchOn(!switchOn); localStorage.setItem("auto save", !switchOn ? "on" : "off") }} className={"switch " + (switchOn ? "on" : "off")}>
              <div className="slider"></div>
            </div>
          </div>
          <div className="quiz_data">
            <div className="title">Quiz Metadata</div>
            <div className="metadata">
              <div className="input_field">
                <p className="field_title">Teacher Name (Mr or Mrs)</p>
                <div className="field">
                  <select value={teacherData.gender} onChange={(e) => { setTeacherData(prev => ({ ...prev, gender: e.target.value, })); localStorage.setItem("teacher data", JSON.stringify({ ...teacherData, gender: e.target.value, })) }} id="field">
                    <option value={"Mr." + userInfo.username}>{"Mr." + userInfo.username}</option>
                    <option value={"Mrs." + userInfo.username}>{"Mrs." + userInfo.username}</option>
                  </select>
                </div>
              </div>
              <div className="input_field">
                <p className="field_title">Category (Subject)</p>
                <div className="field">
                  <select value={teacherData.category} onChange={(e) => { setTeacherData(prev => ({ ...prev, category: e.target.value, })); localStorage.setItem("teacher data", JSON.stringify({ ...teacherData, category: e.target.value, })) }} name="category" id="field">
                    <option value="Arabic">Arabic</option>
                    <option value="English">English</option>
                    <option value="Science">Science</option>
                    <option value="Math" >Math</option>
                    <option value="Social Studies">Social Studies</option>
                  </select>
                </div>
              </div>
              <div className="input_field">
                <p className="field_title">Description (Optional)</p>
                <textarea value={description} onChange={(e) => { localStorage.setItem("description", e.target.value); setDescription(e.target.value) }} ref={descriptionInput} name="description" id="description" placeholder="Wirte a description for your quiz...."></textarea>
              </div>
            </div>
          </div>
          <div className="add_question" ref={questionsContainer}>
            <div className="title" >{isUpdating !== -1 ? "Update" : "New"} Question</div>
            <div className="add_question_content">
              <div className="input_field">
                <p className="field_title">Question</p>
                <input
                  onChange={
                    (e) => {
                      if (e.target.value.trim() !== "" && isArabic(e.target.value.split(" ")[0], { count: 0, })) {
                        e.target.dir = "rtl";
                      } else {
                        e.target.dir = "ltr";
                      }
                    }} ref={questionInput} type="text" placeholder="Question" />
              </div>
              <div className="input_field">
                <p className="field_title">Correct Answer</p>
                <input onChange={
                  (e) => {
                    if (e.target.value.trim() && isArabic(e.target.value.split(" ")[0], { count: 0, })) {
                      e.target.dir = "rtl";
                    } else {
                      e.target.dir = "ltr";
                    }
                  }} ref={correctAnswer} type="text" placeholder="Correct Answer" />
              </div>
              <div className="input_field">
                <p className="field_title">Wrong Answer 1</p>
                <input onChange={
                  (e) => {
                    if (e.target.value.trim() && isArabic(e.target.value.split(" ")[0], { count: 0, })) {
                      e.target.dir = "rtl";
                    } else {
                      e.target.dir = "ltr";
                    }
                  }} ref={wrongAnswer1} type="text" placeholder="Wrong Answer 1" />
              </div>
              <div className="input_field">
                <p className="field_title">Wrong Answer 2</p>
                <input onChange={
                  (e) => {
                    if (e.target.value.trim() && isArabic(e.target.value.split(" ")[0], { count: 0, })) {
                      e.target.dir = "rtl";
                    } else {
                      e.target.dir = "ltr";
                    }
                  }} ref={wrongAnswer2} type="text" placeholder="Wrong Answer 2" />
              </div>
              <div className="input_field">
                <p className="field_title">Wrong Answer 3</p>
                <input onChange={
                  (e) => {
                    if (e.target.value.trim() && isArabic(e.target.value.split(" ")[0], { count: 0, })) {
                      e.target.dir = "rtl";
                    } else {
                      e.target.dir = "ltr";
                    }
                  }} ref={wrongAnswer3} type="text" placeholder="Wrong Answer 3" />
              </div>
            </div>
            <button id="add_question" className={isUpdating !== -1 ? "updating" : ""} onClick={() => isUpdating !== -1 ? updateQuestion() : addQuestion()}>{isUpdating !== -1 ? "Update Question" : "Add Question"}</button>
          </div>
          <div className="questions_container">
            <div className="title">Questions ({questions.length})</div>
            <div className="questions">
              {
                questions.length ?
                  questions.map((question, i) => {
                    return (
                      <div key={"question_" + i} className={"question " + (questions.length === 1 ? "radius" : "")}>
                        <p dir={isArabic(question.question.split(" ")[0], { count: 0, }) ? "rtl" : "ltr"}>{question.question}</p>
                        <div className="buttons">
                          <button id="update" onClick={() => { questionsContainer.current.scrollIntoView({ behavior: "smooth", block: "start" }); setIsUpdating(i) }}><Edit size={18} /></button>
                          <button id="delete" onClick={() => { window.confirm("Are you sure that you want to delete this question?") ? deleteQuestion(i) : console.log("Deleting question canceled.") }}><Trash2 size={18} /></button>
                        </div>
                      </div>
                    )
                  })
                  : <p className="no_quizzes">There are no questions added yet.</p>
              }
            </div>
          </div>
          <div className="main_buttons">
            <button id="preview_quiz" onClick={() => { setPreviewQuestions(questions); navigate("/preview") }}>Preview Quiz</button>
            <button id="publish_quiz" onClick={() => setShowConfirmMessage(true)}>Publish Quiz</button>
          </div>
        </> : <div className="no_access"><Lock size={50} /> <p>Only teachers are allowed to access this page. Others won't be able to view its content.</p></div>}
      {showConfirmMessage ? <PublishingConfirming publishQuiz={publishQuiz} setShowConfirmMessage={setShowConfirmMessage} /> : undefined}
    </div>
  )
}

const PublishingConfirming = ({ publishQuiz, setShowConfirmMessage }) => {
  return (
    <div className="confirm_message">
      <div className="content">
        <p>Are you sure you're ready to publish your quiz, or do you want to double-check it first?</p>
        <div className="buttons">
          <button id="publish" onClick={publishQuiz}>Publish</button>
          <button id="check" onClick={() => setShowConfirmMessage(false)}>Double Check</button>
        </div>
      </div>
    </div>
  );
}

export default CreateQuiz;