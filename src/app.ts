// 설치한 모듈을 불러오는 코드
import { Request, Response, NextFunction } from 'express';
import express = require('express');
import mysql = require('mysql');
const app = express()
const port = 3000
import bodyParser = require('body-parser');
import session = require('express-session');
import axios from 'axios';
import path = require('path');
const publicPath = path.join(__dirname, "files");
import multer = require('multer');
import uuid4 from 'uuid4';


const conn = { // mysql 접속 설정, 데이터베이스 연결
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'root',
  database: '게시판',
};

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

// HTML 파일을 EJS 템플릿으로 렌더링하기 위한 엔진 설정
app.engine('html', require('ejs').renderFile);

// Express 애플리케이션의 템플릿 엔진을 EJS로 설정
app.set('view engine', 'ejs');


// 미들웨어 설정: 클라이언트 요청과 서버 응답 사이에서 동작하는 함수
app.use(bodyParser.urlencoded({ extended: true  }))
app.use(bodyParser.json());
app.use(express.static(publicPath));
// app.use('/css', express.static(path.join(__dirname, 'static')));

app.set('views', path.join(__dirname, 'views'));

// 세션 설정
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));


// 미들웨어: 사용자 인증 및 권한 확인
const requireLogin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.user) {
      res.send(`<script>alert('로그인 후 이용하세요.'); window.location.href='/login';</script>`);
  } else {
    next(); // 다음 미들웨어로 이동
  }
};

// 연결되었는지 확인
let connection = mysql.createConnection(conn);

connection.connect((err: Error) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database');
});

app.get('/', (req: Request, res: Response) => {
  res.render('index.html')
})

// app.get('/test', (req, res) => {
//     res.render('test')
// })

app.get('/test', (req: Request, res: Response) => {
  // Generate random values for board_title and result
  const maxQuery = 'SELECT Max(board_idx) As maxIdx From settable'
  connection.query(maxQuery, (error, results) => {
    if (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ message: 'Error fetching posts' });
      return;
    }

    const maxIdx = results[0].maxIdx; // Get the maximum board_idx
    const newBoardIdx = maxIdx + 1; 
    console.log(maxIdx);
    console.log(newBoardIdx);

    const title = `제목_${newBoardIdx}`;
    const content = `내용_${newBoardIdx}`;
    const writer = `Admin_${newBoardIdx}`;
    const result = Math.floor(Math.random() * 100);

    const idx = [title, result];

    // SQL query to check if the record already exists
    const checkSql = 'SELECT * FROM setTable WHERE board_title = ? AND result = ?';
  

      // Check if the record already exists
      connection.query(checkSql, idx, (error, results) => {
          if (error) {
              console.error('Error fetching posts:', error);
              res.status(500).json({ message: 'Error fetching posts' });
              return;
          }

          if (results.length > 0) {
              // Record already exists, send a response with existing data
              console.log('Record already exists:', results);
              res.json({ real: results });
          } else {
            // Record does not exist, proceed with the insertion
            const insertSql = 'INSERT INTO setTable (board_title, board_content, result, board_writer, board_regdate) VALUES (?, ?, ?, ?, NOW())';
            const params = [title, content, result, writer];

            // Execute the SQL query to insert random data
            connection.query(insertSql, params, (err, insertResult) => {
                if (err) {
                    console.error('Error inserting data:', err);
                    res.status(500).send('Error inserting data');
                    return;
                }

                console.log('Data inserted successfully:', insertResult);

                // Fetch all data from setTable after insertion
                const selectSql = 'SELECT * FROM setTable';
                connection.query(selectSql, (err, selectResult) => {
                    if (err) {
                        console.error('Error fetching data:', err);
                        res.status(500).send('Error fetching data');
                        return;
                    }

                    console.log('All data after insertion:', selectResult);
                    res.json({ real: selectResult });
                  
                  });
              });
          }
      });
    });
});


// 서버 가동
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
