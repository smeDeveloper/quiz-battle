import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { useLoaderContext } from '../contexts/loader';
import { usePopUpContext } from '../contexts/Popup';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useUserContext } from '../contexts/user';
import { ref, update } from 'firebase/database';
import { db } from '../Database';
import isArabic from 'is-arabic';
import { useResultContext } from '../contexts/Results';

const QuizPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const { setIsLoading } = useLoaderContext();
    const { setMessageContent } = usePopUpContext();
    const { userInfo, userIndex, setUserInfo } = useUserContext();
    const { setUserResult } = useResultContext();

    const [quizData, setQuizData] = useState({});
    const [questionIndex, setQuestionIndex] = useState(0);
    const [choosedAnswers, setChoosedAnswers] = useState([]);
    const [showSubmit, setShowSubmit] = useState(false);
    const [remainingTime, setRemainingTime] = useState({ minutes: 0, seconds: 0, });

    const interval = useRef(null);
    const userChoosedAnswers = useRef([]);

    useEffect(() => {
        if (userInfo.quizEndsAt) {
            interval.current = setInterval(() => {
                const remainingMinutes = Math.floor((userInfo.quizEndsAt - new Date().getTime()) / 1000 / 60);
                const remainingSeconds = Math.floor((userInfo.quizEndsAt - new Date().getTime()) / 1000 % 60);
                if (remainingMinutes < 1 && remainingSeconds < 1) {
                    finish();
                    clearInterval(interval.current);
                } else {
                    setRemainingTime({ minutes: remainingMinutes, seconds: remainingSeconds, });
                }
            }, 1000)
        }else {
            clearInterval(interval.current);
        }
        return () => clearInterval(interval.current);
    }, [quizData])

    useEffect(() => {
        setIsLoading(prev => prev + 1);
        if (userInfo.role && (userInfo.playedQuizzes ? !userInfo.playedQuizzes.includes(id) : true)) {
            if (userInfo.role && userInfo.role === "student") {
                if (userInfo.playingQuiz && userInfo.playingQuiz === id) {
                    setChoosedAnswers(userInfo.choosedAnswers || []);
                    userChoosedAnswers.current = userInfo.choosedAnswers || [];
                    fetch("http://localhost:3001/api/quiz/no-correct-answer/" + id).then(res => res.json())
                        .then(data => {
                            setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
                            if (data.failed) {
                                setMessageContent({
                                    title: "Failed To Fetch",
                                    message: data.msg,
                                })
                                navigate("/home")
                            } else {
                                const questions = [...data.questions];
                                const newQuestions = questions.map(question => {
                                    const answers = [...question.answers];
                                    const newAnswers = [];
                                    while (newAnswers.length !== 4) {
                                        const randomIndex = Math.floor(Math.random() * answers.length);
                                        newAnswers.push(answers[randomIndex]);
                                        answers.splice(randomIndex, 1);
                                    }
                                    return { ...question, answers: newAnswers, };
                                })
                                setQuizData({ ...data, questions: newQuestions, });
                            }
                        }).catch(err => {
                            setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
                            console.log(err);
                            navigate("/home");
                            setMessageContent({
                                title: "Failed To Fetch",
                                message: "Oops! something went wrong while fetching the quiz from the database",
                            })
                        })
                } else {
                    navigate("/info/" + id);
                    setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
                }
            } else {
                if (userInfo.role === "teacher") {
                    navigate("/home");
                    setMessageContent({
                        title: "Access Denied",
                        message: "Only the students can solve the quizzes.",
                    });
                    setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
                }else {
                    setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
                }
            }
        } else {
            if (userInfo.role && userInfo.playedQuizzes && userInfo.playedQuizzes.includes(id)) {
                setMessageContent({
                    title: "Solved Quiz",
                    message: "You have solve this quiz before so you can't solve it again.",
                })
                navigate("/result/" + id);
                setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
            }else {
                setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
            }
        }
        return () => clearInterval(interval.current);
    }, [userIndex])

    const changeAnswer = (index) => {
        if (quizData.questions) {
            const updatedAnswers = [...choosedAnswers];
            updatedAnswers[questionIndex] = quizData.questions[questionIndex].answers[index];
    
            for (let i = 0; i < quizData.questions.length; i++) {
                if (!updatedAnswers[i]) {
                    updatedAnswers[i] = { empty: "true" };
                }
            }
    
            setChoosedAnswers(updatedAnswers);
            userChoosedAnswers.current = updatedAnswers;
    
            setUserInfo(prev => ({
                ...prev,
                choosedAnswers: updatedAnswers,
            }));
    
            update(ref(db, "users/" + userIndex), {
                choosedAnswers: updatedAnswers,
            });
        }
    };

    const finish = () => {
        setIsLoading(prev => prev + 1);
        if (!userInfo.playedQuizzes || !userInfo.playedQuizzes.includes(id)) {
            fetch("http://localhost:3001/api/quiz/with-answers/" + id).then(res => res.json())
                .then(data => {
                    if (!data.failed) {
                        let points = 0;
                        const currentUserChoosedAnswers = [...userChoosedAnswers.current];
                        if (currentUserChoosedAnswers.length !== quizData.questions.length) {
                            for(let i = 0; i < quizData.questions.length; i++) {
                                if(!currentUserChoosedAnswers[i] || currentUserChoosedAnswers[i] === undefined) {
                                    currentUserChoosedAnswers[i] = " ";
                                }
                            }
                        }
                        const correctAnswers = data.correctAnswers;
                        for (let i = 0; i < correctAnswers.length; i++) {
                            if (correctAnswers[i] === currentUserChoosedAnswers[i]) {
                                points += 5;
                            }
                        }
                        fetch("http://localhost:3001/api/submit", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                answers: currentUserChoosedAnswers,
                                points: points,
                                user_name: userInfo.username,
                                user_id: userInfo.id,
                                quiz_id: id,
                            }),
                        }).then(res => res.json())
                            .then(data => {
                                if (data.failed) {
                                    setMessageContent({
                                        title: "Submitting Failed",
                                        message: "Oops! something wrong occured while saving your result.",
                                    })
                                } else {
                                    update(ref(db, "users/" + userIndex), {
                                        playingQuiz: null,
                                        playedQuizzes: userInfo.playedQuizzes ? [...userInfo.playedQuizzes, id] : [id],
                                        quizEndsAt: null,
                                        choosedAnswers: [],
                                    }).then(() => {
                                        setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

                                        setUserInfo(prev => ({
                                            ...prev,
                                            playingQuiz: null,
                                            playedQuizzes: prev.playedQuizzes ? [...prev.playedQuizzes, id] : [id],
                                            choosedAnswers: [],
                                            quizEndsAt: null,
                                        }))
                                        setUserResult({
                                            answers: currentUserChoosedAnswers,
                                            points: points,
                                            user_name: userInfo.username,
                                            user_id: userInfo.id,
                                            quiz_id: id,
                                        })
                                        setMessageContent({
                                            title: "Finished",
                                            message: "You have finished the quiz and your result has been sent to the teacher.",
                                        })
                                        clearInterval(interval.current)
                                        navigate("/result/" + id);
                                    })
                                        .catch(() => {
                                            setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

                                            navigate("/result/" + id);
                                            setUserResult({
                                                answers: currentUserChoosedAnswers,
                                                points: points,
                                                user_name: userInfo.username,
                                                user_id: userInfo.id,
                                                quiz_id: id,
                                            })
                                            clearInterval(interval.current)
                                            setUserInfo(prev => ({
                                                ...prev,
                                                playingQuiz: null,
                                                playedQuizzes: prev.playedQuizzes ? [...prev.playedQuizzes, id] : [id],
                                            }))
                                            setMessageContent({
                                                title: "Finished",
                                                message: "You have finished the quiz and your result has been sent to the teacher.",
                                            })
                                        })
                                }
                            }).catch(err => {
                                console.log(err);
                                setMessageContent({
                                    title: "Submitting Failed",
                                    message: "Oops! something wrong occured while saving your result.",
                                })
                                setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

                            })
                    } else {
                        setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

                        setMessageContent({
                            title: "Submitting Failed",
                            message: "Oops! something wrong occured while saving your result.",
                        })
                    }
                }).catch(err => {
                    console.log(err);
                    setMessageContent({
                        title: "Submitting Failed",
                        message: "Oops! something wrong occured while saving your result.",
                    })
                    setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

                })
        } else {
            navigate("/result/" + id);
            setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

            clearInterval(interval.current)
        }
    }

    return (
        <div className="quiz_page_container">
            <header>
                <p className="title">{quizData.category} Quiz</p>
                <p className="timer"><Clock /> <b>{userInfo.quizEndsAt ? `${remainingTime.minutes < 10 ? "0" + remainingTime.minutes : remainingTime.minutes}:${remainingTime.seconds < 10 ? "0" + remainingTime.seconds : remainingTime.seconds}` : "--:--"}</b></p>
            </header>
            <div className="question_container">
                <div className="content">
                    <div className="question_text" dir={quizData.questions ? (isArabic(quizData.questions[questionIndex].question.split(" ")[0], { count: 0, }) ? "rtl" : "ltr") : "ltr"}>{quizData.questions ? quizData.questions[questionIndex].question : "Fetching Questions"}</div>
                    <div className="answers">
                        <button onClick={() => changeAnswer(0)} className={"answer " + (choosedAnswers[questionIndex] === (quizData.questions ? quizData.questions[questionIndex].answers[0] : "") ? "active" : "")} dir={quizData.questions ? (isArabic(quizData.questions[questionIndex].answers[0].split(" ")[0], { count: 0, }) ? "rtl" : "ltr") : "ltr"}>{quizData.questions ? quizData.questions[questionIndex].answers[0] : "Fetching"}</button>
                        <button onClick={() => changeAnswer(1)} className={"answer " + (choosedAnswers[questionIndex] === (quizData.questions ? quizData.questions[questionIndex].answers[1] : "") ? "active" : "")} dir={quizData.questions ? (isArabic(quizData.questions[questionIndex].answers[1].split(" ")[0], { count: 0, }) ? "rtl" : "ltr") : "ltr"}>{quizData.questions ? quizData.questions[questionIndex].answers[1] : "Fetching"}</button>
                        <button onClick={() => changeAnswer(2)} className={"answer " + (choosedAnswers[questionIndex] === (quizData.questions ? quizData.questions[questionIndex].answers[2] : "") ? "active" : "")} dir={quizData.questions ? (isArabic(quizData.questions[questionIndex].answers[2].split(" ")[0], { count: 0, }) ? "rtl" : "ltr") : "ltr"}>{quizData.questions ? quizData.questions[questionIndex].answers[2] : "Fetching"}</button>
                        <button onClick={() => changeAnswer(3)} className={"answer " + (choosedAnswers[questionIndex] === (quizData.questions ? quizData.questions[questionIndex].answers[3] : "") ? "active" : "")} dir={quizData.questions ? (isArabic(quizData.questions[questionIndex].answers[3].split(" ")[0], { count: 0, }) ? "rtl" : "ltr") : "ltr"}>{quizData.questions ? quizData.questions[questionIndex].answers[3] : "Fetching"}</button>
                    </div>
                </div>
            </div>
            <div className="controls">
                <button onClick={() => { questionIndex !== 0 ? setQuestionIndex(prev => prev - 1) : console.clear() }} className={questionIndex === 0 ? "disabled" : ""}><ChevronLeft /> Prev</button>
                <div className="question_index">{questionIndex + 1 < 10 ? "0" + (questionIndex + 1) : questionIndex + 1}/{quizData.questions ? (quizData.questions.length < 10 ? "0" + quizData.questions.length : quizData.questions.length) : "00"}</div>
                <button onClick={() => { questionIndex + 1 !== (quizData.questions ? quizData.questions.length : 0) ? setQuestionIndex(prev => prev + 1) : setShowSubmit(true) }} className={questionIndex + 1 === (quizData.questions ? quizData.questions.length : 0) ? "finish" : ""}>{questionIndex + 1 === (quizData.questions ? quizData.questions.length : 0) ? "Finish" : <>Next <ChevronRight /></>}</button>
            </div>
            {showSubmit ? <SubmitMessageAlert finish={finish} quizData={quizData} setShowSubmit={setShowSubmit} /> : undefined}
        </div>
    )
}

const SubmitMessageAlert = ({ finish, setShowSubmit, quizData }) => {
    return (
        <div className="confirm_message">
            <div className="content">
                <p>Do you want to finish and submit the quiz now or you want to double check your answers?</p>
                <div className="buttons">
                    <button id="publish" onClick={() => finish()}>Finish</button>
                    <button id="check" onClick={() => setShowSubmit(false)}>Double Check</button>
                </div>
            </div>
        </div>
    );
}

export default QuizPage;