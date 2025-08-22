import React, { useEffect, useRef, useState } from 'react'
import { Atom, BookA, BookOpenText, Calculator, Earth, Languages, Microscope, Radical, Search, Swords } from 'lucide-react'
import { useUserContext } from '../contexts/user'
import { useQuizzesContext } from "../contexts/Quizzes";
import { useNavigate } from 'react-router-dom';
import isArabic from 'is-arabic';
import { usePopUpContext } from '../contexts/Popup';

const HomePage = () => {
  const navigate = useNavigate();

  const { userInfo } = useUserContext();
  const { quizzes } = useQuizzesContext();
  const { setMessageContent } = usePopUpContext();

  const [render, setRender] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [showingTeacherQuizzes, setShowingTeacherQuizzes] = useState(false);
  const [teacherQuizzes, setTeacherQuizzes] = useState([]);

  const categories = ["Science", "Math", "Arabic", "English", "Social Studies"];

  useEffect(() => {
    setRender(prev => prev + 1);
  }, [userInfo, quizzes])

  const searchInputRef = useRef();

  const search = (e) => {
    const value = typeof e === "string" ? e.toLowerCase().trim() : e.target.value.toLowerCase().trim();
    setSearchResults([]);
    setShowingTeacherQuizzes(false);
    for (let i = 0; i < quizzes.length; i++) {
      if (quizzes[i].from_name.toLowerCase().trim().includes(value) || quizzes[i].description.toLowerCase().trim().includes(value) || quizzes[i].category.toLowerCase().trim().includes(value) || quizzes[i]._id.includes(value)) {
        setSearchResults(prev => ([...prev, quizzes[i]]))
      }
    }
  }

  const showTeacherQuizzes = () => {
    setSearchResults([]);
    if(searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    if (showingTeacherQuizzes) {
      setShowingTeacherQuizzes(false);
    } else {
      setShowingTeacherQuizzes(true);
      const teacher_quizzes = quizzes.filter(quiz => quiz.from_id === userInfo.id);
      setTeacherQuizzes(teacher_quizzes)
    }
  }

  return (
    <div className="home_page_container">
      <header>
        <p className="website_name">Quiz Battle</p>
        <div className="search">
          <Search size={18} color="#666" />
          <input ref={searchInputRef} type="search" onChange={search} placeholder='Search' />
        </div>
      </header>
      {
        userInfo.role === "teacher" ?
          <>
            <button id="create_quiz" onClick={() => navigate("/create")}>Create Quiz</button>
            <button id="my_quizzes" onClick={showTeacherQuizzes}>{showingTeacherQuizzes ? "Cancel" : "My Quizzes"}</button>
          </>
          : undefined
      }
      <div className="categories">
        <div className="categories-title">Categories</div>
        <div className="content">
          {
            categories.map((category, i) => {
              return (
                <div onClick={() => { searchInputRef.current.focus(); searchInputRef.current.value = category; search(category) }} key={"category_" + i} className={"category " + category.replace(" ", "_").toLowerCase()}>
                  <div className="icons">
                    {category === "Science" ? 
                    <>
                      <div className="icon"><Microscope size={60}/></div>
                      <div className="icon"><Atom size={60}/></div>
                    </>
                    : (
                      category === "Math" ?
                      <>
                        <div className="icon"><Calculator size={60}/></div>
                        <div className="icon"><Radical size={60}/></div>
                      </>
                      : 
                      (category === "Social Studies" ? 
                        <>
                          <div className="icon"><Swords size={60}/></div>
                          <div className="icon"><Earth size={60}/></div>
                        </>
                        : (
                          category === "English" ? 
                          <>
                            <div className="icon"><Languages size={60}/></div>
                            <div className="icon"><BookA size={60}/></div>
                          </>
                          : 
                          <>
                            <div className="icon"><BookOpenText size={60}/></div>
                            <div className="icon"><Languages size={60}/></div>
                          </>
                        )
                      )
                    )
                  }
                  </div>
                  <div className="title">{category}</div>
                </div>
              )
            })
          }
        </div>
      </div>
      <div className="quizzes">
        <div className="quiz_title">Quizzes</div>
        <div className="content">
          {
            quizzes.length ?
              (
                searchInputRef.current && searchInputRef.current.value && searchInputRef.current.value.trim().length ?
                  (
                    searchResults.length ?
                      searchResults.map((quiz, i) => {
                        return (
                          <div className="quiz" key={"Quiz_" + i}>
                            <div className="main_content">
                              <p className="title">{quiz.category}</p>
                              <p className="teacher_name">{quiz.from_name}</p>
                              <p className="questions_number">{quiz.questions.length} Questions</p>
                              <p className="description">{quiz.description ? quiz.description : "No Description Provided"}</p>
                            </div>
                            {quiz.from_id === userInfo.id ? <button className="details" onClick={() => navigate("/details/" + quiz._id)}>Quiz Details</button> : <button className="start" onClick={() => {userInfo.role === "student" ? navigate("/info/" + quiz._id) : setMessageContent({title: "Access Denied", message: "Only the students can access the quizzes.",})}}>Start Quiz</button>}
                          </div>
                        )
                      })
                      : <p className="no_search_results">No Results Found For "{searchInputRef.current.value}" . Try something else.</p>
                  )
                  : (
                    showingTeacherQuizzes ?
                      (
                        teacherQuizzes.length ?
                          teacherQuizzes.map((quiz, i) => {
                            return (
                              <div className="quiz" key={"Quiz_" + i}>
                                <div className="main_content">
                                  <p className="title">{quiz.category}</p>
                                  <p className="teacher_name">{quiz.from_name}</p>
                                  <p className="questions_number">{quiz.questions.length} Questions</p>
                                  <p className="description">{quiz.description ? quiz.description : "No Description Provided"}</p>
                                </div>
                                {quiz.from_id === userInfo.id ? <button className="details" onClick={() => navigate("/details/" + quiz._id)}>Quiz Details</button> : <button className="start"  onClick={() => {userInfo.role === "student" ? navigate("/info/" + quiz._id) : setMessageContent({title: "Access Denied", message: "Only the students can access the quizzes.",})}}>Start Quiz</button>}
                              </div>
                            )
                          })
                          : <p className="no_quizzes">You dont't have any quizzes yet.</p>
                      )
                      : quizzes.map((quiz, i) => {
                        return (
                          <div className="quiz" key={"Quiz_" + i}>
                            <div className="main_content">
                              <p className="title">{quiz.category}</p>
                              <p className="teacher_name">{quiz.from_name}</p>
                              <p className="questions_number">{quiz.questions ? quiz.questions.length : 0} Questions</p>
                              <p className="description" dir={quiz.description ? (isArabic(quiz.description.split(" ")[0] , { count: 0,}) ? "rtl" : "ltr") : "ltr"}>{quiz.description ? quiz.description : "No Description Provided"}</p>
                            </div>
                            {quiz.from_id === userInfo.id ? <button className="details" onClick={() => navigate("/details/" + quiz._id)}>Quiz Details</button> : <button className="start"  onClick={() => {userInfo.role === "student" ? navigate("/info/" + quiz._id) : setMessageContent({title: "Access Denied", message: "Only the students can access the quizzes.",})}}>Start Quiz</button>}
                          </div>
                        )
                      })
                  )
              )
              : <p className="no_quizzes">No quizzes available at the moment. Please check back later!</p>
          }
        </div>
      </div>
    </div >
  )
}

export default HomePage