import { ChevronLeft } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar'
import { useNavigate, useParams } from 'react-router-dom'
import { useUserContext } from '../contexts/user'
import { useLoaderContext } from '../contexts/loader'
import { usePopUpContext } from '../contexts/Popup'

const ResultPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { user } = useUserContext();
    const { setIsLoading } = useLoaderContext();
    const { setMessageContent } = usePopUpContext();

    const [userResult, setUserResult] = useState({});
    const [quizAnswersDetails, setQuizAnswersDetails] = useState({ correctAnswers: 0, wrongAnswers: 0, });
    const [userPercentage, setUserPercentage] = useState(0);

    useEffect(() => {
        setIsLoading(prev => prev + 1);
        fetch("https://quiz-battle-api.vercel.app/api/result", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userID: user,
                quizID: id,
            }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.failed) {
                    setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
                    setMessageContent({
                        title: "Result Fetching Error",
                        message: "Oops! something went wrong while fetching you result.",
                    })
                    navigate("/home");
                } else {
                    if (!data.quizQuestions || !data.result) {
                        setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

                        setMessageContent({
                            title: "Result Fetching Error",
                            message: "Oops! something went wrong while fetching your result.",
                        })
                        navigate("/home");
                    } else {
                        setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

                        setUserResult(data);
                        let correctAnswers = 0;
                        let wrongAnswers = 0;
                        for (let i = 0; i < data.quizQuestions.questions.length; i++) {
                            if (data.quizQuestions.questions[i].correctAnswer === data.result.answers[i]) {
                                correctAnswers += 1;
                            } else {
                                wrongAnswers += 1;
                            }
                        }
                        setUserPercentage(Math.floor(correctAnswers / data.quizQuestions.questions.length * 100));
                        setQuizAnswersDetails({
                            correctAnswers: correctAnswers,
                            wrongAnswers: wrongAnswers,
                        })
                    }
                }
            }).catch(err => {
                console.log(err);
                navigate("/home");
                setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

                setMessageContent({
                    title: "Result Fetching Error",
                    message: "Oops! something went wrong while fetching your result.",
                })
            })
    }, [])

    return (
        <div className="result_page_container">
            <header>
                <ChevronLeft onClick={() => navigate("/home")} />
                <p>Quiz Result</p>
            </header>
            <div className="user_result_container">
                <div className="details">
                    <p className="title">Details</p>
                    <div className="content">
                        <div className="points">
                            <p className="key">Points :</p>
                            <p className="value">{userResult.result ? userResult.result.points : 0}</p>
                        </div>
                        <div className="correct_answers">
                            <p className="key">Correct Answers : </p>
                            <p className="value">{quizAnswersDetails.correctAnswers}</p>
                        </div>
                        <div className="wrong_answers">
                            <p className="key">Wrong Answers : </p>
                            <p className="value">{quizAnswersDetails.wrongAnswers}</p>
                        </div>
                    </div>
                </div>
                <div className="percentage">
                    <p className="title">Percentage</p>
                    <CircularProgressbar styles={buildStyles({
                        pathColor: "#00f1a1",
                        textColor: "#FFF",
                        trailColor: "#FFFFFF33",
                        pathTransitionDuration: 3,
                    })} value={userPercentage} text={`${userPercentage}%`} />
                </div>
            </div>
            <div className="questions">
                <p className="title">Questions</p>
                <div className="content">
                    {
                        userResult.quizQuestions ?
                            userResult.quizQuestions.questions.map((question, i) => {
                                return (
                                    <div className="question" key={"question_" + i}>
                                        {userResult.result.answers[i] === ' ' || userResult.result.answers[i].empty ? <span>No Answer</span> : undefined}
                                        <p className="question_text">{question.question}</p>
                                        <div className="answers">
                                            <button className={"answer " + (question.answers[0] === userResult.result.answers[i] ? "choosed_answer correct_answer" : "correct_answer")}>{question.answers[0]}</button>
                                            <button className={"answer " + (question.answers[1] === userResult.result.answers[i] ? "choosed_answer" : "")}>{question.answers[1]}</button>
                                            <button className={"answer " + (question.answers[2] === userResult.result.answers[i] ? "choosed_answer" : "")}>{question.answers[2]}</button>
                                            <button className={"answer " + (question.answers[3] === userResult.result.answers[i] ? "choosed_answer" : "")}>{question.answers[3]}</button>
                                        </div>
                                    </div>
                                )
                            })
                            : <p>Fetching Questions</p>
                    }
                </div>
            </div>
        </div>
    )
}

export default ResultPage