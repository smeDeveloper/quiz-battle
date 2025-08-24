import { useEffect, useState, useRef } from 'react';
import AuthPage from './components/SignIn';
import { get, ref } from 'firebase/database';
import { db } from './Database';
import { Routes, Route, useNavigate } from "react-router-dom";
import './App.css';
import HomePage from './components/HomePage';
import { LoaderContextProvider } from './contexts/loader';
import { PopUpContextProvider } from './contexts/Popup';
import { UserContextProvider } from './contexts/user';
import { QuizzesContextProvider } from "./contexts/Quizzes";
import CreateQuiz from './components/CreateQuiz';
import PreviewQuiz from './components/PreviewQuiz';
import { PreviewQuestionsProvider } from './contexts/Preview';
import { Copy, Github, InstagramIcon, Link2, Linkedin, Mail, WifiOff } from 'lucide-react';
import QuizDetails from './components/QuizDetails';
import QuizInfoPage from './components/QuizInfoPage';
import QuizPage from './components/QuizPage';
import { ResultContextProvider } from './contexts/Results';
import ResultPage from './components/ResultPage';
import copy from 'copy-to-clipboard';

function App() {
  const navigate = useNavigate();

  const [messageContent, setMessageContent] = useState({ title: "", message: "", });
  const [user, setUser] = useState(localStorage.getItem("user") || "");
  const [userInfo, setUserInfo] = useState({});
  const [isLoading, setIsLoading] = useState(0);
  const [quizzes, setQuizzes] = useState([]);
  const [connected, setConnected] = useState(true);
  const [userIndex, setUserIndex] = useState(-1);
  const [userResult, setUserResult] = useState({});
  const [copyLink, setCopyLink] = useState("");
  const [previewQuestions, setPreviewQuestions] = useState(localStorage.getItem("questions") ? JSON.parse(localStorage.getItem("questions")) : []);

  const popUpRef = useRef();

  useEffect(() => {
    if (user) {
      setIsLoading(prev => prev + 1);
      get(ref(db, "users")).then(snapShot => {
        const users = snapShot.val() || [];
        const currentUser = users.find(currentUser => currentUser.id === user);
        const userIndex = users.findIndex(currentUser => currentUser.id === user);
        if (currentUser) {
          setUserInfo(currentUser);
          setUserIndex(userIndex);
          if (!currentUser.playingQuiz) {
            const windowPath = window.location.pathname;
            if (windowPath !== "/create" && windowPath !== "/preview" && !windowPath.includes("/details/") && !windowPath.includes("/info/") && !window.location.pathname.includes("/quiz/") && !window.location.pathname.includes("/result/")) {
              navigate("/home");
            }
          } else {
            navigate("/quiz/" + currentUser.playingQuiz);
          }
          setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
        } else {
          localStorage.removeItem("user");
          setUser("");
          navigate("/sign-in")
          setIsLoading(prev => prev !== 0 ? prev - 1 : prev);
        }
      })
    } else {
      navigate("/sign-in");
    }
  }, [user, navigate])

  useEffect(() => {
    if (user) {
      setIsLoading(prev => prev + 1);
      fetch("http://localhost:3001/api/quiz")
        .then(res => res.json())
        .then(data => {
          setQuizzes(data.quizzes);
          setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

        }).catch(err => {
          console.log(err);
          setIsLoading(prev => prev !== 0 ? prev - 1 : prev);

          setMessageContent({ title: "Fetching Failed", message: "Oops! something wrong occured while fetching the quizzes from the database, refresh the page to try again.", })
        })
    } else {
      setQuizzes([]);
    }
  }, [user])

  useEffect(() => {
    if (navigator.onLine) {
      setConnected(true);
    } else {
      setConnected(false);
    }

    window.addEventListener("online", () => {
      setConnected(true);
    })

    window.addEventListener("offline", () => {
      setConnected(false);
    })

    window.addEventListener("beforeunload", () => {
      localStorage.setItem("user", user);
    })
  }, [user])

  const hidePopUp = (e) => {
    if (popUpRef.current) {
      const popUpRect = popUpRef.current.getBoundingClientRect();
      const { clientX, clientY } = e;
      if (clientX > popUpRect.right || clientX < popUpRect.left || clientY > popUpRect.bottom || clientY < popUpRect.top)
        setMessageContent({ title: "", message: "", })
    }
  }

  return (
    <>
      <LoaderContextProvider value={{ isLoading, setIsLoading }}>
        <PopUpContextProvider value={{ setMessageContent, setCopyLink }}>
          <UserContextProvider value={{ setUser, user, setUserInfo, userInfo, userIndex, setUserIndex }}>
            <QuizzesContextProvider value={{ quizzes, setQuizzes }}>
              <PreviewQuestionsProvider value={{ previewQuestions, setPreviewQuestions }}>
                <ResultContextProvider value={{ userResult, setUserResult }}>
                  <Routes>
                    <Route path="/sign-in" element={<AuthPage />} />
                    <Route path="/" element={<><HomePage /></>} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/create" element={<CreateQuiz />} />
                    <Route path="/preview" element={<PreviewQuiz />} />
                    <Route path="/details/:id" element={<QuizDetails />} />
                    <Route path="/info/:id" element={<QuizInfoPage />} />
                    <Route path="/quiz/:id" element={<QuizPage />} />
                    <Route path="/result/:id" element={<ResultPage />} />
                  </Routes>
                  {
                    window.location.pathname !== "/sign-in" && window.location.pathname !== "/preview" && !window.location.pathname.includes("/info/") && !window.location.pathname.includes("/quiz/") ?
                      <footer>
                        <div className="footer-container">
                          <div className="footer-left">
                            <h2>Quiz Battle</h2>
                            <p>Developed by <strong>Saif Maher Elsmahy</strong></p>
                          </div>
                          <div className="footer-right">
                            <a text="LinkedIn" className="linkedin" href="https://www.linkedin.com/in/sme-dev-5036a5350/" target="_blank"><Linkedin /></a>
                            <a text="Instagram" className="instagram" href="https://instagram.com/sme.dev" target="_blank"><InstagramIcon /></a>
                            <a text="Github" href="https://github.com/smeDeveloper" target="_blank"><Github /></a>
                            <a text="Email" href="mailto:sme.dev212@gmail.com"><Mail /></a>
                          </div>
                        </div>

                        <div className="footer-bottom">
                          © <span id="year">{new Date().getFullYear()}</span> Quiz Battle. All rights reserved.
                        </div>
                      </footer> : undefined
                  }
                </ResultContextProvider>
              </PreviewQuestionsProvider>
            </QuizzesContextProvider>
          </UserContextProvider>
        </PopUpContextProvider>
      </LoaderContextProvider>
      {
        isLoading ?
          <div className="loading_screen">
            <span></span>
          </div>
          : undefined
      }
      {
        copyLink ?
          <div className="quiz_link_container">
            <div className="content">
              <p className="title">Quiz Link</p>
              <div className="main_content">
                <div className="link">
                  <div className="icon">
                    <Link2 />
                  </div>
                  <div className="link">{copyLink}</div>
                </div>
                <button onClick={() => {copy(copyLink);setTimeout(() => {copy(copyLink)},1);setMessageContent({ title: "Link Copied", message: "Quiz link has been copied! ✅", })}}>copy <Copy size={16} /></button>
                <button onClick={() => setCopyLink("")}>Close</button>
              </div>
            </div>
          </div> : undefined
      }
      {
        messageContent.message ?
          <div onClick={hidePopUp} className="pop_up_container">
            <div ref={popUpRef} className="content">
              <div className="pop_up_title">{messageContent.title}</div>
              <div className="pop_up_content">{messageContent.message}</div>
            </div>
          </div>
          : undefined
      }
      {
        !connected ?
          <div className="no_internet">
            <div className="content">
              <WifiOff size={70} />
              <p>No Internet Connection.</p>
            </div>
          </div> : undefined
      }
    </>
  );
}

export default App;