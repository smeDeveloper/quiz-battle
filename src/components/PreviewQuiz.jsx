import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreviewContext } from '../contexts/Preview';

const PreviewQuiz = () => {
    const navigate = useNavigate();
    const { previewQuestions } = usePreviewContext();

    const [questions, setQuestions] = useState(previewQuestions);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [choosedAnswers, setChoosedAnswers] = useState([]);

    useEffect(() => {
        if (previewQuestions.length) {
            const appQuestions = questions.map(q => ({
                ...q,
                answers: [...q.answers],
            }));

            const newQuestions = [];

            while (newQuestions.length < questions.length && appQuestions.length > 0) {
                const randomIndex = Math.floor(Math.random() * appQuestions.length);
                const selectedQuestion = appQuestions.splice(randomIndex, 1)[0];

                const shuffledAnswers = [...selectedQuestion.answers].sort(() => Math.random() - 0.5);

                const newAnswers = shuffledAnswers.slice(0, 4);

                newQuestions.push({
                    question: selectedQuestion.question,
                    answers: newAnswers,
                    correctAnswer: selectedQuestion.correctAnswer,
                });
            }

            setQuestions(newQuestions);
        }
    }, []);

    const changeAnswer = (index) => {
        if (previewQuestions.length) {
            const answers = [...choosedAnswers];
            answers[questionIndex] = questions[questionIndex].answers[index];
            setChoosedAnswers(answers);
        }
    }

    return (
        <div className="preview_quiz_page">
            <header>
                <ChevronLeft onClick={() => navigate("/create")} />
                <p>Preview Quiz</p>
            </header>
            <div className="quiz_content">
                <div className="content">
                    <div className="question">{previewQuestions.length ? questions[questionIndex].question : "No question found."}</div>
                    <div className="answers">
                        <button id="answer" className={previewQuestions.length && choosedAnswers[questionIndex] && choosedAnswers[questionIndex] === questions[questionIndex].answers[0] ? "active" : ""} onClick={() => changeAnswer(0)}>{previewQuestions.length ? questions[questionIndex].answers[0] : "No answer found."}</button>
                        <button id="answer" className={previewQuestions.length && choosedAnswers[questionIndex] && choosedAnswers[questionIndex] === questions[questionIndex].answers[1] ? "active" : ""} onClick={() => changeAnswer(1)}>{previewQuestions.length ? questions[questionIndex].answers[1] : "No answer found."}</button>
                        <button id="answer" className={previewQuestions.length && choosedAnswers[questionIndex] && choosedAnswers[questionIndex] === questions[questionIndex].answers[2] ? "active" : ""} onClick={() => changeAnswer(2)}>{previewQuestions.length ? questions[questionIndex].answers[2] : "No answer found."}</button>
                        <button id="answer" className={previewQuestions.length && choosedAnswers[questionIndex] && choosedAnswers[questionIndex] === questions[questionIndex].answers[3] ? "active" : ""} onClick={() => changeAnswer(3)}>{previewQuestions.length ? questions[questionIndex].answers[3] : "No answer found."}</button>
                    </div>
                </div>
            </div>
            <div className="controls">
                <button onClick={() => { previewQuestions.length && questionIndex > 0 && setQuestionIndex(questionIndex - 1) }}><ChevronLeft /> Prev</button>
                <button onClick={() => { previewQuestions.length && questionIndex < questions.length - 1 && setQuestionIndex(questionIndex + 1) }}>Next <ChevronRight /></button>
            </div>
        </div>
    )
}

export default PreviewQuiz