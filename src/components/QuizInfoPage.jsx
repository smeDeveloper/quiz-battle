import React, { useEffect, useState } from 'react';
import { CheckCheck, ChevronLeft, Clock, FileQuestion, ScrollTextIcon, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePopUpContext } from '../contexts/Popup';
import { useLoaderContext } from '../contexts/loader';
import { useUserContext } from '../contexts/user';
import { get, ref, set, update } from 'firebase/database';
import { db } from '../Database';

const QuizInfoPage = () => {
  const navigate = useNavigate();

  const { id } = useParams();
  const [quizData, setQuizData] = useState({});

  const { setMessageContent } = usePopUpContext();
  const { setIsLoading } = useLoaderContext();
  const { userInfo, setUserInfo } = useUserContext();

  useEffect(() => {
    setIsLoading(prev => prev + 1);
    fetch("http://localhost:3001/api/quiz/" + id)
      .then(res => res.json())
      .then(data => {
        setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

        if (data.failed) {
          setMessageContent({
            title: "Failed To Fetch",
            message: "Failed to fetch the quiz from the database!",
          })
          navigate("/home");
        } else {
          setQuizData(data);
        }
      }).catch(err => {
        setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

        navigate("/home");
        setMessageContent({
          title: "Failed To Fetch",
          message: "Failed to fetch the quiz from the database!",
        })
      })
  }, [])

  useEffect(() => {
    if (userInfo.role === "teacher") {
      navigate("/home");
      setMessageContent({
        title: "Access Denied",
        message: "Only the students can access the quizzes.",
      })
    }
  }, [userInfo])

  const startQuiz = () => {
    if (!userInfo.playedQuizzes || !userInfo.playedQuizzes.includes(id)) {
      if (userInfo.role === "student") {
        setIsLoading(prev => prev + 1);
        get(ref(db, "users")).then(snapShot => {
          const users = snapShot.val();
          const userIndex = users.findIndex(user => user.id === userInfo.id);
          const quizTime = Math.floor(quizData.questions.length * 30) * 1000;
          update(ref(db, "users/" + userIndex), {
            playingQuiz: id,
            quizEndsAt: new Date().getTime() + quizTime,
          }).then(() => {
            setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

            setUserInfo(prev => ({
              ...prev, playingQuiz: id, quizEndsAt: new Date().getTime() + quizTime,
            }))
            navigate("/quiz/" + id);
          }).catch(err => {
            console.log(err);
            setIsLoading(prev => prev + 1);
            setMessageContent({
              title: "Starting Error",
              message: "Oops! something went wrong while starting the quiz.",
            })
          })
        }).catch(err => {
          console.log(err);
          setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

          setMessageContent({
            title: "Starting Error",
            message: "Oops! something went wrong while starting the quiz.",
          })
        })
      } else {
        setMessageContent({
          title: "Access Denied",
          message: "Only the students can solve the quizzes.",
        })
        navigate("/home");
      }
    }else {
      navigate("/result/" + id);
    }
  }

  return (
    <div className="quiz_info_container">
      <header>
        <ChevronLeft onClick={() => navigate("/home")} />
        <p>Start Quiz</p>
      </header>
      <div className="content_container">
        <div className="content">
          <p className="title">{quizData.category}</p>
          <div className="data">
            <div className="item teacher">
              <div className="icon"><User /></div>
              <div className="text">
                <p className="key">Teacher Name</p>
                <p className="value">{quizData.from_name}</p>
              </div>
            </div>
            <div className="item">
              <div className="icon"><FileQuestion /></div>
              <div className="text">
                <p className="key">Questions Number</p>
                <p className="value">{quizData.questions ? quizData.questions.length : 0}</p>
              </div>
            </div>
            <div className="item">
              <div className="icon"><Clock /></div>
              <div className="text">
                <p className="key">Quiz Time</p>
                <p className="value">{quizData.questions ? (`${Math.floor(quizData.questions.length * 30 / 60) < 10 ? "0" + Math.floor(quizData.questions.length * 30 / 60) : Math.floor(quizData.questions.length * 30 / 60)}:${quizData.questions.length * 30 % 60 < 10 ? "0" + quizData.questions.length * 30 % 60 : quizData.questions.length * 30 % 60}`) : "00:00"}</p>
              </div>
            </div>
            <div className="item">
              <div className="icon"><CheckCheck /></div>
              <div className="text">
                <p className="key">Total Points</p>
                <p className="value">{quizData.questions ? quizData.questions.length * 5 : 0}</p>
              </div>
            </div>
          </div>
          <div className="description">
            <p className="title description"><ScrollTextIcon size={18} /> Description</p>
            <p className="value">{quizData.description ? quizData.description : "No Description Provided"}</p>
          </div>
        </div>
      </div>
      <button id="start_quiz" className={userInfo.playedQuizzes ? (userInfo.playedQuizzes.includes(id) ? "show_result" : "start_quiz") : "start_quiz"} onClick={startQuiz}>{userInfo.playedQuizzes ? (userInfo.playedQuizzes.includes(id) ? "Show Result" : "Start Quiz") : "Start Quiz"}</button>
    </div>
  )
}

export default QuizInfoPage;