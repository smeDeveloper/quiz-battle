import isArabic from "is-arabic";
import { useEffect, useState } from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Trash2, Edit, BarChart3, Users, Clock, CheckCheck, Eye, Share2 } from "lucide-react";
import { usePopUpContext } from "../contexts/Popup";
import { useLoaderContext } from "../contexts/loader";
import { useUserContext } from "../contexts/user";
import { useQuizzesContext } from "../contexts/Quizzes";
import copy from "copy-to-clipboard";

const QuizDetails = () => {
    const { id } = useParams();

    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("Overview");
    const [averageScore, setAverageScore] = useState(0);
    const [quizData, setQuizData] = useState({});
    const [results, setResults] = useState({});
    const [quizTime, setQuizTime] = useState();
    const [showUpdateContainer, setShowUpdateContainer] = useState(false);
    const [showUserResults, setShowUserResults] = useState(-1);
    const [showRemoveQuiz, setShowRemoveQuiz] = useState(false);
    const [scoreDistribution, setScoreDistribution] = useState({
        first: 0,
        second: 0,
        third: 0,
    })

    const { setMessageContent } = usePopUpContext();
    const { setIsLoading } = useLoaderContext();
    const { setQuizzes, quizzes } = useQuizzesContext();
    const { user , userInfo } = useUserContext();

    useEffect(() => {
        setIsLoading(prev => prev + 1);
        fetch("https://quiz-battle-api.vercel.app/api/results", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: user,
                quizID: id,
            }),
        }).then(res => res.json())
            .then(data => {
                setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
                if (!data.quizData) {
                    navigate("/home");
                    if (data.msg) {
                        setMessageContent({ title: "Access Denied", message: data.msg, });
                    } else {
                        setMessageContent({ title: "Fetching Failed", message: "Failed to fetch this quiz data from the database", });
                    }
                } else {
                    const timeNeeded = data.quizData.questions.length * 30;
                    const minutes = Math.floor(timeNeeded / 60);
                    const seconds = timeNeeded % 60;
                    setQuizTime((minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds));
                    setQuizData(data.quizData);
                    setResults(data.studentsResults);
                }
            }).catch(err => {
                navigate("/home");
                setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
                setMessageContent({
                    title: "Fetching Failed",
                    message: "Failed to fetch your quiz details from the database.",
                })
            })
    }, [])

    useEffect(() => {
        if (quizData.category) {
            let totalStudentsResults = 0;
            const totalPoints = results.length * (quizData.questions.length * 5);
            const firstUsers = [];
            const secondUsers = [];
            const thirdUsers = [];
            for (let i = 0; i < results.length; i++) {
                const userResult = Math.round(results[i].points / (quizData.questions.length * 5) * 100);
                if (userResult >= 80) {
                    firstUsers.push(results[i]);
                } else if (userResult >= 50 && userResult < 80) {
                    secondUsers.push(results[i]);
                } else {
                    thirdUsers.push(results[i]);
                }
                totalStudentsResults += results[i].points;
            }
            setScoreDistribution({
                first: firstUsers.length ? Math.round(firstUsers.length / results.length * 100) : 0,
                second: secondUsers.length ? Math.round(secondUsers.length / results.length * 100) : 0,
                third: thirdUsers.length ? Math.round(thirdUsers.length / results.length * 100) : 0,
            });
            const averageScore = totalPoints ? Math.round(totalStudentsResults / totalPoints * 100) : 0;
            setAverageScore(averageScore);
        }
    }, [quizData])

    const getResultColor = (points) => {
        const score = Math.round(points / (quizData.questions.length * 5) * 100);
        switch (true) {
            case score >= 80:
                return "#0b0";
            case score >= 50:
                return "#f90";
            case score < 50:
                return "#f00";
        }
    }

    return (
        <div className={"quiz_details_container"}>
            <header>
                <ChevronLeft onClick={() => navigate("/home")} />
                <p>Quiz Details</p>
            </header>
            <div className="top_content">
                <div className="top">
                    <p>{quizData.category}</p>
                    <div className="right_side">
                        <button className="share" onClick={() => {copy(window.location.origin + "/info/" + id);setTimeout(() => {copy(window.location.origin + "/info/" + id)},1);setMessageContent({ title: "Link Copied", message: "Quiz link has been copied! ✅", })}}><Share2 size={18} /></button>
                        <button className="edit" onClick={() => setShowUpdateContainer(true)}><Edit size={18} /></button>
                        <button className="remove" onClick={() => setShowRemoveQuiz(true)}><Trash2 size={18} /></button>
                    </div>
                </div>
                <div className="details">
                    <div className="item">
                        <div className="icon"><BarChart3 /></div>
                        <div className="text">
                            <div className="title">Total Questions</div>
                            <div className="value">{quizData.questions ? quizData.questions.length : 0}</div>
                        </div>
                    </div>
                    <div className="item">
                        <div className="icon"><CheckCheck /></div>
                        <div className="text">
                            <div className="title">Total Points</div>
                            <div className="value">{quizData.questions ? quizData.questions.length * 5 : 0}</div>
                        </div>
                    </div>
                    <div className="item">
                        <div className="icon"><BarChart3 /></div>
                        <div className="text">
                            <div className="title">Average Score</div>
                            <div className="value">{averageScore}%</div>
                        </div>
                    </div>
                    <div className="item">
                        <div className="icon"><Users /></div>
                        <div className="text">
                            <div className="title">Total Students</div>
                            <div className="value">{results.length}</div>
                        </div>
                    </div>
                    <div className="item">
                        <div className="icon"><Clock /></div>
                        <div className="text">
                            <div className="title">Total Time</div>
                            <div className="value">{quizTime}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="more_details">
                <div className="navigation_bar">
                    <button onClick={() => setActiveTab("Overview")} className={activeTab === "Overview" ? "active" : ""}>Overview</button>
                    <button onClick={() => setActiveTab("Questions")} className={activeTab === "Questions" ? "active" : ""}>Questions</button>
                    <button onClick={() => setActiveTab("Results")} className={activeTab === "Results" ? "active" : ""}>Results</button>
                    <button onClick={() => setActiveTab("Analytics")} className={activeTab === "Analytics" ? "active" : ""}>Analytics</button>
                </div>
                <div className="content">
                    {
                        activeTab === "Overview" ?
                            <div className="overview">
                                <div className="items">
                                    <div className="item">
                                        <div className="item_content">
                                            <p className="key">Teacher Name:</p>
                                            <p className="value">{quizData.from_name}</p>
                                        </div>
                                    </div>
                                    <div className="item">
                                        <div className="item_content">
                                            <p className="key">Subject:</p>
                                            <p className="value">{quizData.category ? quizData.category : "Feching"}</p>
                                        </div>
                                    </div>
                                    <div className="item">
                                        <div className="item_content">
                                            <p className="key">Questions Number:</p>
                                            <p className="value">{quizData.questions ? quizData.questions.length : 0}</p>
                                        </div>
                                    </div>
                                    <div className="item">
                                        <div className="item_content">
                                            <p className="key">Quiz Time:</p>
                                            <p className="value">{((quizData.questions ? quizData.questions.length : 0) * 30) / 60} Minutes</p>
                                        </div>
                                    </div>
                                    <div className="item">
                                        <div className="item_content">
                                            <p className="key">Total Points:</p>
                                            <p className="value">{(quizData.questions ? quizData.questions.length : 0) * 5} </p>
                                        </div>
                                    </div>
                                    <div className="description">
                                        <p className="title">Description</p>
                                        <p className="value" dir={quizData.description ? (isArabic(quizData.description.split(" ")[0], { count: 0, }) ? "rtl" : "ltr") : "ltr"}>{quizData.description ? quizData.description : "No Description Provided"}</p>
                                    </div>
                                </div>
                            </div>
                            :
                            (activeTab === "Questions" ?
                                <div className="questions_container">
                                    <div className="questions">
                                        {
                                            quizData.questions && quizData.questions.map((question, i) => {
                                                return (
                                                    <div className="question" key={"question_" + i}>
                                                        <div className="question_index">{i + 1}</div>
                                                        <div className="question_content">
                                                            <p className="question_text" dir={question.question ? (isArabic(question.question.split(" ")[0], { count: 0, }) ? "rtl" : "ltr") : "ltr"}>{question.question}</p>
                                                            <div className="answers">
                                                                <button className={question.answers[0] === question.correctAnswer ? "active" : ""} dir={question.answers ? (isArabic(question.answers[0].split(" ")[0], { count: 0, }) ? "rtl" : "ltr") : "ltr"}>{question.answers[0]}</button>
                                                                <button className={question.answers[1] === question.correctAnswer ? "active" : ""} dir={question.answers ? (isArabic(question.answers[1].split(" ")[0], { count: 0, }) ? "rtl" : "ltr") : "ltr"}>{question.answers[1]}</button>
                                                                <button className={question.answers[2] === question.correctAnswer ? "active" : ""} dir={question.answers ? (isArabic(question.answers[2].split(" ")[0], { count: 0, }) ? "rtl" : "ltr") : "ltr"}>{question.answers[2]}</button>
                                                                <button className={question.answers[3] === question.correctAnswer ? "active" : ""} dir={question.answers ? (isArabic(question.answers[3].split(" ")[0], { count: 0, }) ? "rtl" : "ltr") : "ltr"}>{question.answers[3]}</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                </div>
                                : (
                                    activeTab === "Results" ?
                                        <div className="results_container">
                                            {
                                                showUserResults !== -1 ?
                                                    <div className="questions">
                                                        <button className="back" onClick={() => setShowUserResults(-1)}><ChevronLeft /> Back</button>
                                                        {
                                                            quizData.questions.map((question, i) => {
                                                                return (
                                                                    <div className="question" key={"question_" + i}>
                                                                        {results[showUserResults].answers[i] === ' ' || results[showUserResults].answers[i].empty ? <span>No Answer</span> : undefined}
                                                                        <p className="question_text" dir={question.question ? (isArabic(question.question.split(" ")[0], { count: 0, }) ? "rtl" : "ltr") : "ltr"}>{question.question}</p>
                                                                        <div className="answers">
                                                                            <button className={question.answers[0] === question.correctAnswer ? "active" : (question.answers[0] === results[showUserResults].answers[i] ? "red-active" : "")} dir={question.answers ? (isArabic(question.answers[0].split(" ")[0], { count: 0, }) ? "rtl" : "ltr") : "ltr"}>{question.answers[0]}</button>
                                                                            <button className={question.answers[1] === question.correctAnswer ? "active" : (question.answers[1] === results[showUserResults].answers[i] ? "red-active" : "")} dir={question.answers ? (isArabic(question.answers[1].split(" ")[0], { count: 0, }) ? "rtl" : "ltr") : "ltr"}>{question.answers[1]}</button>
                                                                            <button className={question.answers[2] === question.correctAnswer ? "active" : (question.answers[2] === results[showUserResults].answers[i] ? "red-active" : "")} dir={question.answers ? (isArabic(question.answers[2].split(" ")[0], { count: 0, }) ? "rtl" : "ltr") : "ltr"}>{question.answers[2]}</button>
                                                                            <button className={question.answers[3] === question.correctAnswer ? "active" : (question.answers[3] === results[showUserResults].answers[i] ? "red-active" : "")} dir={question.answers ? (isArabic(question.answers[3].split(" ")[0], { count: 0, }) ? "rtl" : "ltr") : "ltr"}>{question.answers[3]}</button>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })
                                                        }
                                                    </div>
                                                    : <table>
                                                        <thead>
                                                            <tr>
                                                                <th>Name</th>
                                                                <th>Result</th>
                                                                <th>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {
                                                                results.length ?
                                                                    results.map((result, i) => {
                                                                        return (
                                                                            <tr key={"result_" + i}>
                                                                                <td className="name">{result.name}</td>
                                                                                <td className="result" style={{ color: getResultColor(result.points), }}>{Math.round((result.points / (quizData.questions.length * 5)) * 100)}%</td>
                                                                                <td className="actions"><button onClick={() => setShowUserResults(i)}><Eye /></button></td>
                                                                            </tr>
                                                                        )
                                                                    })
                                                                    : <tr>
                                                                        <td className={"not-played"} colSpan={4}>Not Played Yet</td>
                                                                    </tr>
                                                            }
                                                        </tbody>
                                                    </table>
                                            }
                                        </div> : <div className="analytics_container">
                                            <div className="score_distribution">
                                                <p className="title">Score Distribution</p>
                                                <div className="scores">
                                                    <div className="score first">
                                                        <p className="percentage">80-100%</p>
                                                        <div className="value"><span className="span_container"><span style={{ width: `${scoreDistribution.first}%`, }}></span></span> <p>{scoreDistribution.first}%</p></div>
                                                    </div>
                                                    <div className="score second">
                                                        <p className="percentage">50-79%</p>
                                                        <div className="value"><span className="span_container"><span style={{ width: `${scoreDistribution.second}%`, }}></span></span> <p>{scoreDistribution.second}%</p></div>
                                                    </div>
                                                    <div className="score third">
                                                        <p className="percentage">0-49%</p>
                                                        <div className="value"><span className="span_container"><span style={{ width: `${scoreDistribution.third}%`, }}></span></span> <p>{scoreDistribution.third}%</p></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="average_score">
                                                <p className="title">Average Score</p>
                                                <div className="content">
                                                    <CircularProgressbar styles={buildStyles({
                                                        pathColor: "#00f1a1",
                                                        textColor: "#FFF",
                                                        trailColor: "#FFFFFF33",
                                                    })} text={averageScore + "%"} value={averageScore} />
                                                </div>
                                            </div>
                                        </div>
                                )
                            )
                    }
                </div>
            </div>
            {showRemoveQuiz ? <DeleteQuiz quizID={id} userID={user} setShowRemoveQuiz={setShowRemoveQuiz} setMessageContent={setMessageContent} setQuizzes={setQuizzes} quizzes={quizzes} setIsLoading={setIsLoading} navigate={navigate}/> : undefined}
            {showUpdateContainer ? <UpdateQuiz category={quizData.category} description={quizData.description} setIsLoading={setIsLoading} setMessageContent={setMessageContent} setShowUpdateContainer={setShowUpdateContainer} quizID={id} userID={user} setQuizData={setQuizData} setQuizzes={setQuizzes} quizzes={quizzes} teacherName={userInfo.username} mrOrMrs={localStorage.getItem("teacher data") ? JSON.parse(localStorage.getItem("teacher data")).gender : "Mr." + userInfo.username} /> : undefined}
        </div>
    );
}

const UpdateQuiz = ({ description, category, setIsLoading, setMessageContent, setShowUpdateContainer, quizID, userID, setQuizData, setQuizzes, quizzes , teacherName , mrOrMrs }) => {
    const [quizDescription, setDescription] = useState(description);
    const [quizCategory, setQuizCategory] = useState(category)
    const [teacherGender , setTeacherGender] = useState(mrOrMrs);

    const categories = ["Math", "English", "Arabic", "Science", "Social Studies"];

    const updateQuiz = () => {
        if (description === quizDescription && category === quizCategory && teacherGender === mrOrMrs) {
            setMessageContent({
                title: "Nothing Changed",
                message: "There are no changes to update.",
            });
        } else {
            if (categories.includes(quizCategory)) {
                setIsLoading(prev => prev + 1);
                fetch("https://quiz-battle-api.vercel.app/api/edit", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        data: {
                            category: quizCategory,
                            description: quizDescription,
                            from_name: teacherGender,
                        },
                        quizID: quizID,
                        userID: userID,
                    }),
                }).then(res => res.json())
                    .then(data => {
                        setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

                        if (data.failed) {
                            setMessageContent({
                                title: "Failed to update",
                                message: data.msg,
                            })
                        } else {
                            const quizIndex = quizzes.findIndex(quiz => quiz._id === quizID);

                            if (quizIndex !== -1) {
                                const appQuizzes = [...quizzes];
                                appQuizzes[quizIndex] = { ...appQuizzes[quizIndex], category: quizCategory, description: quizDescription,from_name: teacherGender, }
                                setQuizzes(appQuizzes);
                            }

                            setQuizData(prev => ({
                                ...prev, 
                                category: quizCategory, 
                                description: quizDescription,
                                from_name: teacherGender,
                            }))
                            localStorage.setItem("teacher data" , JSON.stringify({gender: teacherGender, category: quizCategory,}))
                            setShowUpdateContainer(false);
                        }
                    }).catch(err => {
                        setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

                        setMessageContent({
                            title: "Failed to update",
                            message: "Oops! something wrong occured while updating your quiz, try again later.",
                        })
                    })
            } else {
                setMessageContent({
                    title: "Invalid Input",
                    message: "Check your inputs again because there is something wrong.",
                })
            }
        }
    }

    return (
        <div className="update_quiz_container">
            <div className="content">
                <p className="title">Update Quiz</p>
                <div className="update_container">
                    <div className="field">
                        <select onChange={(e) => setTeacherGender(e.target.value)} value={teacherGender}>
                            <option value={"Mr." + teacherName}>Mr.{teacherName}</option>
                            <option value={"Mrs." + teacherName}>Mrs.{teacherName}</option>
                        </select>
                    </div>
                    <div className="field">
                        <select onChange={(e) => setQuizCategory(e.target.value)} value={quizCategory}>
                            <option value="Science">Science</option>
                            <option value="English">English</option>
                            <option value="Math">Math</option>
                            <option value="Arabic">Arabic</option>
                            <option value="Social Studies">Social Studies</option>
                        </select>
                    </div>
                    <div className="field">
                        <div className="title">Description</div>
                        <textarea placeholder="Enter your quiz description" name="" id="" onChange={(e) => setDescription(e.target.value)} value={quizDescription}></textarea>
                    </div>
                    <div className="buttons">
                        <button className="update" onClick={updateQuiz}>Update</button>
                        <button className="cancel" onClick={() => setShowUpdateContainer(false)}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const DeleteQuiz = ({ quizID, userID, setShowRemoveQuiz, setMessageContent, setIsLoading, navigate, quizzes, setQuizzes }) => {
    const [inputText, setInputText] = useState("");

    const removeQuiz = () => {
        setIsLoading(prev => prev + 1);
        fetch("https://quiz-battle-api.vercel.app/api/delete", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userID: userID,
                quizID: quizID,
            }),
        }).then(res => res.json())
            .then(data => {
                setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

                if (data.failed) {
                    setMessageContent({
                        title: "Failed To Remove",
                        message: data.msg,
                    })
                } else {
                    navigate("/home");
                    setMessageContent({
                        title: "Quiz Removed",
                        message: "Quiz removed successfully!",
                    })
                    const newQuizzes = [...quizzes];
                    const quizIndex = newQuizzes.findIndex(quiz => quiz._id === quizID)
                    newQuizzes.splice(quizIndex, 1);
                    setQuizzes(newQuizzes)
                }
            })
    }

    return (
        <div className="delete_quiz_container">
            <div className="content">
                <p className="title">Remove Quiz</p>
                <div className="delete_content">
                    <p className="text">Enter the word <span>"remove"</span> in the input below to confirm your deletion.</p>
                    <input type="text" placeholder="Remove Quiz" onChange={(e) => setInputText(e.target.value)} />
                    <div className="buttons">
                        <button onClick={() => { inputText === "remove" ? removeQuiz() : console.log("Can't delete quiz now.") }} className={"delete " + (inputText === "remove" ? "" : "disabled")}>Remove</button>
                        <button className="cancel" onClick={() => setShowRemoveQuiz(false)}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuizDetails;