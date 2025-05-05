# Assessment API Documentation

## Table of Contents

1. [Questions API](#heading=h.1hqaqr5fauzc)  
2. [Section API](#heading=h.m335cgvdrozy)  
3. [Test API](#heading=h.osttcqvl4hn2)

## Question API

### Question Field Values

#### Type Values

- `radio` \- Single choice question  
- `checkbox` \- Multiple choice question  
- `file_upload` \- File upload question  
- `text` \- Short text answer  
- `textarea` \- Long text answer  
- `objtext` \- Objective text question  
- `rating` \- Rating question

#### Level Values

- `easy` \- Easy difficulty level  
- `medium` \- Medium difficulty level  
- `hard` \- Hard difficulty level

#### Grading Type Values

- `quiz` \- Quiz type assessment  
- `feedback` \- Feedback type assessment  
- `exercise` \- Exercise type assessment

#### Media Type Values

- `image` \- Image media  
- `pdf` \- PDF document  
- `doc` \- Word document  
- `text` \- Text content  
- `audio` \- Audio file  
- `youtube` \- YouTube video  
- `vimeo` \- Vimeo video

### Create Question

- **Endpoint**: `POST /questions`  
- **Description**: Creates a new question with its answers  
- **Content-Type**: `multipart/form-data`  
- **Request Body**:

title: "Question Title"

description: "Question Description"

category\_id: "uuid"

type: "radio"

level: "medium"

marks: "10"

status: "published"

ideal\_time: "300"

gradingtype: "quiz"

params: {"additional\_info": "Any additional parameters"}

media\_type: "image"

media\_file: \[file\]  // for image/audio/pdf/doc etc

media\_url: ""  // for youtube link/video link

section\_id:""

test\_id: ""

answers\[0\]\[answer\]: "First answer option"

answers\[0\]\[marks\]: "10"

answers\[0\]\[is\_correct\]: "true"

answers\[0\]\[order\]: "1"

answers\[0\]\[comments\]: "Explanation for this answer"

answers\[0\]\[media\_type\]: "image"

answers\[0\]\[media\_file\]: \[file\]  // for image/audio/pdf/doc etc

answers\[0\]\[media\_url\]: ""

answers\[1\]\[answer\]: "Second answer option"

answers\[1\]\[marks\]: "0"

answers\[1\]\[is\_correct\]: "false"

answers\[1\]\[order\]: "2"

answers\[1\]\[comments\]: "Explanation for this answer"

answers\[1\]\[media\_type\]: "youtube"

answers\[1\]\[media\_file\]: ""

answers\[1\]\[media\_url\]: "https://www.youtube.com/watch?v=video\_id"

#### Response

{

  "id": "api.question.create",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "id": "uuid",

    "title": "Question Title",

    "description": "Question Description",

    "category\_id": "uuid",

    "type": "radio",

    "level": "medium",

    "marks": 10,

    "status": "published",

    "ideal\_time": 300,

    "gradingtype": "quiz",

    "params": {

        "additional\_info": "Any additional parameters"

    },

    "media\_type": "image",

    "media\_id": "uuid",

    "tenant\_id": "uuid",  // Added to response

    "media": {

        "id": "uuid",

        "type": "image",

        "path": "/uploads/images/",

        "source": "question\_image.jpg",

        "original\_filename": "question\_image.jpg",

        "size": 1024000,

        "storage": "local",

        "params": {

            "width": 800,

            "height": 600

        }

    },

    "createdBy": "uuid",

    "createdAt": "2024-03-21T10:00:00Z",

    "updatedBy": "uuid",

    "updatedAt": "2024-03-21T10:00:00Z",

    "answers": \[

        {

            "id": "uuid",

            "answer": "First answer option",

            "marks": 10,

            "is\_correct": true,

            "order": 1,

            "comments": "Explanation for this answer",

            "media\_type": "image",

            "media\_id": "uuid",

            "tenant\_id": "uuid",  // Added to response

            "media": {

                "id": "uuid",

                "type": "image",

                "path": "/uploads/images/",

                "source": "answer1.jpg",

                "original\_filename": "answer1.jpg",

                "size": 512000,

                "storage": "local",

                "params": {

                    "width": 400,

                    "height": 300

                }

            }

        },

        {

            "id": "uuid",

            "answer": "Second answer option",

            "marks": 0,

            "is\_correct": false,

            "order": 2,

            "comments": "Explanation for this answer",

            "media\_type": "youtube",

            "media\_id": "uuid",

            "media": {

                "id": "uuid",

                "type": "youtube",

                "path": "",

                "source": "https://www.youtube.com/watch?v=video\_id",

                "original\_filename": "",

                "size": 0,

                "storage": "external",

                "params": {

                    "embed\_url": "https://www.youtube.com/embed/video\_id",

                    "thumbnail\_url": "https://img.youtube.com/vi/video\_id/maxresdefault.jpg"

                }

            }

        }

    \]

  }

}

### Get All Questions

- **Endpoint**: `GET /questions/list`  
- **Description**: Retrieves a list of all questions with their answers and pagination  
- **Content-Type**: `application/json`  
- **Query Parameters**:  
  - page: Integer (default: 1\) \- Page number for pagination  
  - limit: Integer (default: 10\) \- Number of items per page  
  - search: String \- Search term to filter questions by title  
  - category\_id: UUID \- Filter questions by category  
  - type: String \- Filter questions by type  
  - level: String \- Filter questions by level  
  - status: String \- Filter questions by status

#### Response

{

  "id": "api.question.list",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "questions": \[

      {

        "id": "uuid",

        "title": "Question Title",

        "alias": "question-alias",

        "description": "Question Description",

        "category\_id": "uuid",

        "type": "radio",

        "level": "medium",

        "marks": 10,

        "status": "published",

        "ideal\_time": 300,

        "gradingtype": "quiz",

        "params": {

            "additional\_info": "Any additional parameters"

        },

        "media\_type": "image",

        "media\_id": "uuid",

        "tenant\_id": "uuid",  // Added to response

        "createdBy": "uuid",

        "createdAt": "2024-03-21T10:00:00Z",

        "updatedBy": "uuid",

        "updatedAt": "2024-03-21T10:00:00Z",

        "answers": \[

            {

                "id": "uuid",

                "answer": "First answer option",

                "marks": 10,

                "is\_correct": true,

                "order": 1,

                "comments": "Explanation for this answer",

                "media\_type": "image",

                "media\_id": "uuid",

                "tenant\_id": "uuid",  // Added to response

                "media": {

                    "id": "uuid",

                    "type": "image",

                    "path": "/uploads/images/",

                    "source": "answer1.jpg",

                    "original\_filename": "answer1.jpg",

                    "size": 512000,

                    "storage": "local",

                    "params": {

                        "width": 400,

                        "height": 300

                    }

                }

            },

            {

                "id": "uuid",

                "answer": "Second answer option",

                "marks": 0,

                "is\_correct": false,

                "order": 2,

                "comments": "Explanation for this answer",

                "media\_type": "youtube",

                "media\_id": "uuid",

                "media": {

                    "id": "uuid",

                    "type": "youtube",

                    "path": "",

                    "source": "https://www.youtube.com/watch?v=video\_id",

                    "original\_filename": "",

                    "size": 0,

                    "storage": "external",

                    "params": {

                        "embed\_url": "https://www.youtube.com/embed/video\_id",

                        "thumbnail\_url": "https://img.youtube.com/vi/video\_id/maxresdefault.jpg"

                    }

                }

            }

        \]

      }

    \],

    "pagination": {

      "total": 100,

      "page": 1,

      "limit": 10,

      "pages": 10

    }

  }

}

### Get Question by ID

- **Endpoint**: `GET /questions/{id}`  
- **Description**: Retrieves a specific question with its answers by ID  
- **Content-Type**: `application/json`  
- **Path Parameters**:  
  - id: UUID \- Question ID

#### Response

{

  "id": "api.question.get",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "id": "uuid",

    "title": "Question Title",

    "alias": "question-alias",

    "description": "Question Description",

    "category\_id": "uuid",

    "type": "radio",

    "level": "medium",

    "marks": 10,

    "status": "published",

    "ideal\_time": 300,

    "gradingtype": "quiz",

    "params": {

        "additional\_info": "Any additional parameters"

    },

    "media\_type": "image",

    "media\_id": "uuid",

    "tenant\_id": "uuid",  // Added to response

    "media": {

        "id": "uuid",

        "type": "image",

        "path": "/uploads/images/",

        "source": "question\_image.jpg",

        "original\_filename": "question\_image.jpg",

        "size": 1024000,

        "storage": "local",

        "params": {

            "width": 800,

            "height": 600

        }

    },

    "createdBy": "uuid",

    "createdAt": "2024-03-21T10:00:00Z",

    "updatedBy": "uuid",

    "updatedAt": "2024-03-21T10:00:00Z",

    "answers": \[

        {

            "id": "uuid",

            "answer": "First answer option",

            "marks": 10,

            "is\_correct": true,

            "order": 1,

            "comments": "Explanation for this answer",

            "media\_type": "image",

            "media\_id": "uuid",

            "tenant\_id": "uuid",  // Added to response

            "media": {

                "id": "uuid",

                "type": "image",

                "path": "/uploads/images/",

                "source": "answer1.jpg",

                "original\_filename": "answer1.jpg",

                "size": 512000,

                "storage": "local",

                "params": {

                    "width": 400,

                    "height": 300

                }

            }

        },

        {

            "id": "uuid",

            "answer": "Second answer option",

            "marks": 0,

            "is\_correct": false,

            "order": 2,

            "comments": "Explanation for this answer",

            "media\_type": "youtube",

            "media\_id": "uuid",

            "media": {

                "id": "uuid",

                "type": "youtube",

                "path": "",

                "source": "https://www.youtube.com/watch?v=video\_id",

                "original\_filename": "",

                "size": 0,

                "storage": "external",

                "params": {

                    "embed\_url": "https://www.youtube.com/embed/video\_id",

                    "thumbnail\_url": "https://img.youtube.com/vi/video\_id/maxresdefault.jpg"

                }

            }

        }

    \]

  }

}

### Delete Question

- **Endpoint**: `DELETE /questions/{id}`  
- **Description**: Deletes a specific question and its associated answers  
- **Content-Type**: `application/json`  
- **Path Parameters**:  
  - id: UUID \- Question ID

#### Response

{

  "id": "api.question.delete",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "message": "Question and its answers deleted successfully"

  }

}

### Update Question

- **Endpoint**: `PATCH /questions/{id}`  
- **Description**: Updates a specific question and its answers  
- **Content-Type**: `multipart/form-data`  
- **Path Parameters**:  
  - id: UUID \- Question ID  
- **Request Body**:

title: "Updated Question Title"

description: "Updated Question Description"

category\_id: "uuid"

type: "radio"

level: "medium"

marks: "15"

status: "published"

ideal\_time: "400"

gradingtype: "quiz"

params: {"additional\_info": "Updated parameters"}

media\_type: "image"

media\_file: \[file\]  // for image/audio/pdf/doc etc

media\_url: ""  // for youtube link/video link

answers\[0\]\[id\]: "uuid"

answers\[0\]\[answer\]: "Updated first answer"

answers\[0\]\[marks\]: "15"

answers\[0\]\[is\_correct\]: "true"

answers\[0\]\[order\]: "1"

answers\[0\]\[comments\]: "Updated explanation"

answers\[0\]\[media\_type\]: "image"

answers\[0\]\[media\_file\]: \[file\]  // for image/audio/pdf/doc etc

answers\[0\]\[media\_url\]: ""

answers\[1\]\[id\]: "uuid"

answers\[1\]\[answer\]: "Updated second answer"

answers\[1\]\[marks\]: "0"

answers\[1\]\[is\_correct\]: "false"

answers\[1\]\[order\]: "2"

answers\[1\]\[comments\]: "Updated explanation"

answers\[1\]\[media\_type\]: "youtube"

answers\[1\]\[media\_file\]: ""

answers\[1\]\[media\_url\]: "https://www.youtube.com/watch?v=updated\_video\_id"

#### Response

{

  "id": "api.question.update",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "id": "uuid",

    "title": "Updated Question Title",

    "description": "Updated Question Description",

    "category\_id": "uuid",

    "type": "radio",

    "level": "medium",

    "marks": 15,

    "status": "published",

    "ideal\_time": 400,

    "gradingtype": "quiz",

    "params": {

        "additional\_info": "Updated parameters"

    },

    "media\_type": "image",

    "media\_id": "uuid",

    "tenant\_id": "uuid",  // Added to response

    "media": {

        "id": "uuid",

        "type": "image",

        "path": "/uploads/images/",

        "source": "updated\_question\_image.jpg",

        "original\_filename": "updated\_question\_image.jpg",

        "size": 1024000,

        "storage": "local",

        "params": {

            "width": 800,

            "height": 600

        }

    },

    "createdBy": "uuid",

    "createdAt": "2024-03-21T10:00:00Z",

    "updatedBy": "uuid",

    "updatedAt": "2024-03-21T10:00:00Z",

    "answers": \[

        {

            "id": "uuid",

            "answer": "Updated first answer",

            "marks": 15,

            "is\_correct": true,

            "order": 1,

            "comments": "Updated explanation",

            "media\_type": "image",

            "media\_id": "uuid",

            "tenant\_id": "uuid",  // Added to response

            "media": {

                "id": "uuid",

                "type": "image",

                "path": "/uploads/images/",

                "source": "updated\_answer1.jpg",

                "original\_filename": "updated\_answer1.jpg",

                "size": 512000,

                "storage": "local",

                "params": {

                    "width": 400,

                    "height": 300

                }

            }

        },

        {

            "id": "uuid",

            "answer": "Updated second answer",

            "marks": 0,

            "is\_correct": false,

            "order": 2,

            "comments": "Updated explanation",

            "media\_type": "youtube",

            "media\_id": "uuid",

            "media": {

                "id": "uuid",

                "type": "youtube",

                "path": "",

                "source": "https://www.youtube.com/watch?v=updated\_video\_id",

                "original\_filename": "",

                "size": 0,

                "storage": "external",

                "params": {

                    "embed\_url": "https://www.youtube.com/embed/updated\_video\_id",

                    "thumbnail\_url": "https://img.youtube.com/vi/updated\_video\_id/maxresdefault.jpg"

                }

            }

        }

    \]

  }

}

### Get Questions with Filters

- **Endpoint**: `GET /questions`  
- **Description**: Retrieves a list of questions with filtering, search, and sorting capabilities  
- **Content-Type**: `application/json`  
- **Query Parameters**:  
  - page: Integer (default: 1\) \- Page number for pagination  
  - limit: Integer (default: 10\) \- Number of items per page  
  - search: String \- Search term to filter questions by title or description  
  - category\_id: UUID \- Filter questions by category  
  - type: String \- Filter questions by type (radio, checkbox, file\_upload, text, textarea, objtext, rating)  
  - level: String \- Filter questions by level (easy, medium, hard)  
  - status: String \- Filter questions by status (published, unpublished)  
  - sort\_by: String \- Field to sort by (title, marks, created\_at, updated\_at)  
  - sort\_order: String \- Sort order (asc, desc)

#### Response

{

  "id": "api.question.list.filtered",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "questions": \[

      {

    "id": "uuid",

        "title": "Question Title",

        "description": "Question Description",

    "category\_id": "uuid",

    "type": "radio",

    "level": "medium",

        "marks": 10,

    "status": "published",

        "ideal\_time": 300,

    "gradingtype": "quiz",

    "params": {

            "additional\_info": "Any additional parameters"

    },

    "media\_type": "image",

        "media\_id": "uuid",        

        "createdBy": "uuid",

        "createdAt": "2024-03-21T10:00:00Z",

        "updatedBy": "uuid",

        "updatedAt": "2024-03-21T10:00:00Z",

        "tenant\_id": "uuid"  // Added to response

      }

    \],

    "pagination": {

      "total": 100,

      "page": 1,

      "limit": 10,

      "pages": 10

    },

    "filters": {

      "applied": {

        "search": "example",

        "category\_id": "uuid",

        "type": "radio",

        "level": "medium",

        "status": "published",

        "sort\_by": "created\_at",

        "sort\_order": "desc"

      },

      "available": {

        "types": \["radio", "checkbox", "file\_upload", "text", "textarea", "objtext", "rating"\],

        "levels": \["easy", "medium", "hard"\],

        "statuses": \["published", "unpublished"\],

        "sort\_fields": \["title", "marks", "created\_at", "updated\_at"\],

        "sort\_orders": \["asc", "desc"\]

      }

    }

  }

}

## Section API

### Create Section

- **Endpoint**: `POST /sections`  
- **Description**: Creates a new section  
- **Content-Type**: `application/json`  
- **Request Body**:

{

    "title": "Section Title",

    "description": "Section Description",

    "test\_id": "uuid",

    "order": 1,

    "status": "published"

}

#### Response

{

  "id": "api.section.create",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "id": "uuid",

    "title": "Section Title",

    "description": "Section Description",

    "test\_id": "uuid",

    "order": 1,

    "status": "published",

    "createdBy": "uuid",

    "createdAt": "2024-03-21T10:00:00Z",

    "updatedBy": "uuid",

    "updatedAt": "2024-03-21T10:00:00Z"

  }

}

### Update Section

- **Endpoint**: `PATCH /sections/{id}`  
- **Description**: Updates a specific section  
- **Content-Type**: `application/json`  
- **Path Parameters**: | Parameter | Type | Description | |-----------|------|-------------| | id | UUID | Section ID |  
- **Request Body**:

{

    "title": "Updated Section Title",

    "description": "Updated Section Description",

    "test\_id": "uuid",

    "order": 2,

    "status": "unpublished"

}

#### Response

{

  "id": "api.section.update",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "id": "uuid",

    "title": "Updated Section Title",

    "description": "Updated Section Description",

    "test\_id": "uuid",

    "order": 2,

    "status": "unpublished",

    "createdBy": "uuid",

    "createdAt": "2024-03-21T10:00:00Z",

    "updatedBy": "uuid",

    "updatedAt": "2024-03-21T10:00:00Z"

  }

}

### Delete Section

- **Endpoint**: `DELETE /sections/{id}`  
- **Description**: Deletes a specific section  
- **Content-Type**: `application/json`  
- **Path Parameters**: | Parameter | Type | Description | |-----------|------|-------------| | id | UUID | Section ID |

#### Response

{

  "id": "api.section.delete",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "message": "Section deleted successfully"

  }

}

## Test API

### Create Test

- **Endpoint**: `POST /tests`  
- **Description**: Creates a new test with its questions  
- **Content-Type**: `multipart/form-data`  
- **Request Body**:

title: "Test Title"

alias: "test-alias"

description: "Test Description"

status: "published"

reviewers: "reviewer1,reviewer2"

show\_time: "true"

time\_duration: "3600"

show\_time\_finished: "true"

time\_finished\_duration: "300"

total\_marks: "100"

passing\_marks: "60"

start\_date: "2024-03-21T00:00:00Z"

end\_date: "2024-12-31T23:59:59Z"

answer\_sheet: "true"

show\_correct\_answer: "true"

print\_answersheet: "true"

questions\_shuffle: "false"

answers\_shuffle: "false"

gradingtype: "quiz"

show\_thankyou\_page: "true"

show\_all\_questions: "false"

pagination\_limit: "10"

show\_questions\_overview: "true"

image: \[file\]

questions\[0\]\[question\_id\]: "uuid"

questions\[0\]\[order\]: "1"

questions\[0\]\[section\_id\]: "1"

questions\[0\]\[is\_compulsory\]: "true"

questions\[1\]\[question\_id\]: "uuid"

questions\[1\]\[order\]: "2"

questions\[1\]\[section\_id\]: "1"

questions\[1\]\[is\_compulsory\]: "false"

#### Response

{

  "id": "api.test.create",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "id": "uuid",

    "title": "Test Title",

    "alias": "test-alias",

    "description": "Test Description",

    "status": "published",

    "reviewers": "reviewer1,reviewer2",

    "show\_time": true,

    "time\_duration": 3600,

    "show\_time\_finished": true,

    "time\_finished\_duration": 300,

    "total\_marks": 100,

    "passing\_marks": 60,

    "start\_date": "2024-03-21T00:00:00Z",

    "end\_date": "2024-12-31T23:59:59Z",

    "answer\_sheet": true,

    "show\_correct\_answer": true,

    "print\_answersheet": true,

    "questions\_shuffle": false,

    "answers\_shuffle": false,

    "gradingtype": "quiz",

    "show\_thankyou\_page": true,

    "show\_all\_questions": false,

    "pagination\_limit": 10,

    "show\_questions\_overview": true,

    "image": "/uploads/images/test.png",

    "tenant\_id": "uuid",  // Added to response

    "createdBy": "uuid",

    "createdAt": "2024-03-21T10:00:00Z",

    "updatedBy": "uuid",

    "updatedAt": "2024-03-21T10:00:00Z",

    "questions": \[

        {

            "id": "uuid",

            "question\_id": "uuid",

            "order": 1,

            "section\_id": 1,

            "is\_compulsory": true,

            "tenant\_id": "uuid",  // Added to response

            "question": {

                "id": "uuid",

                "title": "Question Title",

                "description": "Question Description",

                "type": "radio",

                "level": "medium",

                "marks": 10,

                "status": "published",

                "ideal\_time": 300,

                "gradingtype": "quiz",

                "media\_type": "image",

                "media\_id": "uuid",

                "tenant\_id": "uuid"  // Added to response

            }

        }

    \]

  }

}

### Add Question to Test

- **Endpoint**: `POST /tests/questions/{id}`  
- **Description**: Adds one or more questions to an existing test  
- **Content-Type**: `application/json`  
- **Path Parameters**: | Parameter | Type | Description | |-----------|------|-------------| | id | UUID | Test ID |  
- **Request Body**:

{

    "questions": \[

        {

            "question\_id": "uuid",

            "order": 1,

            "section\_id": 1,

            "is\_compulsory": true

        },

        {

            "question\_id": "uuid",

            "order": 2,

            "section\_id": 1,

            "is\_compulsory": false

        }

    \]

}

#### Response

{

  "id": "api.test.questions.add",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "test\_id": "uuid",

    "questions": \[

        {

            "id": "uuid",

            "question\_id": "uuid",

            "order": 1,

            "section\_id": 1,

            "is\_compulsory": true

        },

        {

            "id": "uuid",

            "question\_id": "uuid",

            "order": 2,

            "section\_id": 1,

            "is\_compulsory": false            

        }

    \]

  }

}

### Remove Question from Test

- **Endpoint**: `DELETE /tests/questions/{id}/{question_id}`  
- **Description**: Removes a question from an existing test  
- **Content-Type**: `application/json`  
- **Path Parameters**: | Parameter | Type | Description | |-----------|------|-------------| | id | UUID | Test ID | | question\_id | UUID | Question ID |

#### Response

{

  "id": "api.test.questions.remove",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "message": "Question removed from test successfully"

  }

}

### Get All Tests

- **Endpoint**: `GET /tests`  
- **Description**: Retrieves a list of all tests with pagination  
- **Content-Type**: `application/json`  
- **Query Parameters**:  
  - page: Integer (default: 1\) \- Page number for pagination  
  - limit: Integer (default: 10\) \- Number of items per page  
  - search: String \- Search term to filter tests by title  
  - status: String \- Filter tests by status (published, unpublished)  
  - gradingtype: String \- Filter tests by grading type  
  - sort\_by: String \- Field to sort by (title, created\_at, updated\_at)  
  - sort\_order: String \- Sort order (asc, desc)

#### Response

{

  "id": "api.test.list",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "tests": \[

      {

        "id": "uuid",

        "title": "Test Title",

        "alias": "test-alias",

        "description": "Test Description",

        "status": "published",

        "reviewers": "reviewer1,reviewer2",

        "show\_time": true,

        "time\_duration": 3600,

        "show\_time\_finished": true,

        "time\_finished\_duration": 300,

        "total\_marks": 100,

        "passing\_marks": 60,

        "start\_date": "2024-03-21T00:00:00Z",

        "end\_date": "2024-12-31T23:59:59Z",

        "answer\_sheet": true,

        "show\_correct\_answer": true,

        "print\_answersheet": true,

        "questions\_shuffle": false,

        "answers\_shuffle": false,

        "gradingtype": "quiz",

        "show\_thankyou\_page": true,

        "show\_all\_questions": false,

        "pagination\_limit": 10,

        "show\_questions\_overview": true,

        "image": "/uploads/images/test.png",       

        "createdBy": "uuid",

        "createdAt": "2024-03-21T10:00:00Z",

        "updatedBy": "uuid",

        "updatedAt": "2024-03-21T10:00:00Z"

      }

    \],

    "pagination": {

      "total": 100,

      "page": 1,

      "limit": 10,

      "pages": 10

    }

  }

}

### Get Test by ID

- **Endpoint**: `GET /tests/{id}`  
- **Description**: Retrieves a specific test with its questions  
- **Content-Type**: `application/json`  
- **Path Parameters**:  
  - id: UUID \- Test ID

#### Response

{

  "id": "api.test.get",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "id": "uuid",

    "title": "Test Title",

    "alias": "test-alias",

    "description": "Test Description",

    "status": "published",

    "reviewers": "reviewer1,reviewer2",

    "show\_time": true,

    "time\_duration": 3600,

    "show\_time\_finished": true,

    "time\_finished\_duration": 300,

    "total\_marks": 100,

    "passing\_marks": 60,

    "start\_date": "2024-03-21T00:00:00Z",

    "end\_date": "2024-12-31T23:59:59Z",

    "answer\_sheet": true,

    "show\_correct\_answer": true,

    "print\_answersheet": true,

    "questions\_shuffle": false,

    "answers\_shuffle": false,

    "gradingtype": "quiz",

    "show\_thankyou\_page": true,

    "show\_all\_questions": false,

    "pagination\_limit": 10,

    "show\_questions\_overview": true,

    "image": "/uploads/images/test.png",

    "createdBy": "uuid",

    "createdAt": "2024-03-21T10:00:00Z",

    "updatedBy": "uuid",

    "updatedAt": "2024-03-21T10:00:00Z",

    "questions": \[

      {

        "id": "uuid",

        "question\_id": "uuid",

        "order": 1,

        "section\_id": 1,

        "is\_compulsory": true,

        "question": {

          "id": "uuid",

          "title": "Question Title",

          "description": "Question Description",

          "type": "radio",

          "level": "medium",

          "marks": 10,

          "status": "published",

          "ideal\_time": 300,

          "gradingtype": "quiz",

          "media\_type": "image",

          "media\_id": "uuid",

          "tenant\_id": "uuid"  // Added to response

        }

      }

    \]

  }

}

### Update Test

- **Endpoint**: `PATCH /tests/{id}`  
- **Description**: Updates a specific test and its questions  
- **Content-Type**: `multipart/form-data`  
- **Path Parameters**:  
  - id: UUID \- Test ID  
- **Request Body**:

title: "Updated Test Title"

alias: "updated-test-alias"

description: "Updated Test Description"

status: "published"

reviewers: "reviewer1,reviewer2,reviewer3"

show\_time: "true"

time\_duration: "7200"

show\_time\_finished: "true"

time\_finished\_duration: "600"

total\_marks: "200"

passing\_marks: "120"

start\_date: "2024-03-21T00:00:00Z"

end\_date: "2024-12-31T23:59:59Z"

answer\_sheet: "true"

show\_correct\_answer: "true"

print\_answersheet: "true"

questions\_shuffle: "true"

answers\_shuffle: "true"

gradingtype: "quiz"

show\_thankyou\_page: "true"

show\_all\_questions: "false"

pagination\_limit: "20"

show\_questions\_overview: "true"

image: \[file\]

questions\[0\]\[id\]: "uuid"

questions\[0\]\[question\_id\]: "uuid"

questions\[0\]\[order\]: "1"

questions\[0\]\[section\_id\]: "1"

questions\[0\]\[is\_compulsory\]: "true"

questions\[1\]\[id\]: "uuid"

questions\[1\]\[question\_id\]: "uuid"

questions\[1\]\[order\]: "2"

questions\[1\]\[section\_id\]: "1"

questions\[1\]\[is\_compulsory\]: "false"

#### Response

{

  "id": "api.test.update",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "id": "uuid",

    "title": "Updated Test Title",

    "alias": "updated-test-alias",

    "description": "Updated Test Description",

    "status": "published",

    "reviewers": "reviewer1,reviewer2,reviewer3",

    "show\_time": true,

    "time\_duration": 7200,

    "show\_time\_finished": true,

    "time\_finished\_duration": 600,

    "total\_marks": 200,

    "passing\_marks": 120,

    "start\_date": "2024-03-21T00:00:00Z",

    "end\_date": "2024-12-31T23:59:59Z",

    "answer\_sheet": true,

    "show\_correct\_answer": true,

    "print\_answersheet": true,

    "questions\_shuffle": true,

    "answers\_shuffle": true,

    "gradingtype": "quiz",

    "show\_thankyou\_page": true,

    "show\_all\_questions": false,

    "pagination\_limit": 20,

    "show\_questions\_overview": true,

    "image": "/uploads/images/test.png",

    "createdBy": "uuid",

    "createdAt": "2024-03-21T10:00:00Z",

    "updatedBy": "uuid",

    "updatedAt": "2024-03-21T10:00:00Z",

    "questions": \[

      {

        "id": "uuid",

        "question\_id": "uuid",

        "order": 1,

        "section\_id": 1,

        "is\_compulsory": true,

        "tenant\_id": "uuid",  // Added to response

        "question": {

          "id": "uuid",

          "title": "Question Title",

          "description": "Question Description",

          "type": "radio",

          "level": "medium",

          "marks": 10,

          "status": "published",

          "ideal\_time": 300,

          "gradingtype": "quiz",

          "media\_type": "image",

          "media\_id": "uuid",

          "tenant\_id": "uuid"  // Added to response

        }

      }

    \]

  }

}

### Delete Test

- **Endpoint**: `DELETE /tests/{id}`  
- **Description**: Deletes a specific test and its associated questions  
- **Content-Type**: `application/json`  
- **Path Parameters**:  
  - id: UUID \- Test ID

#### Response

{

  "id": "api.test.delete",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "message": "Test and its questions deleted successfully"

  }

}

### Start Test

- **Endpoint**: `POST /tests/start/{id}`  
- **Description**: Creates a new test attempt for a user  
- **Content-Type**: `application/json`  
- **Path Parameters**:  
  - id: UUID \- Test ID

#### Response

{

  "id": "api.test.start",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "tracking\_id": "uuid",

    "test\_id": "uuid",

    "user\_id": "uuid",

    "attempt": 1,

    "timestart": "2024-03-21T10:00:00Z",

    "timeend": null,

    "score": 0,

    "status": "started",

    "total\_content": 0,

    "current\_position": 0,

    "time\_spent": 0,

    "tenant\_id": "uuid"  // Added to response

  }

}

### Start Attempt

- **Endpoint**: `PATCH /tests/attempts/{tracking_id}/start`  
- **Description**: Updates the attempt status to started  
- **Content-Type**: `application/json`  
- **Path Parameters**:  
  - tracking\_id: UUID \- Tracking ID of the attempt  
  - test\_id: UUID \- Test ID

#### Response

{

  "id": "api.test.attempt.start",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "tracking\_id": "uuid",

    "test\_id": "uuid",

    "user\_id": "uuid",

    "attempt": 1,

    "timestart": "2024-03-21T10:00:00Z",

    "timeend": null,

    "score": 0,

    "status": "started",

    "total\_content": 0,

    "current\_position": 0,

    "time\_spent": 0

  }

}

### Update Test Tracking

- **Endpoint**: `PATCH /tests/attempts/{tracking_id}/progress`  
- **Description**: Updates the progress of a test attempt  
- **Content-Type**: `application/json`  
- **Path Parameters**:  
  - tracking\_id: UUID \- Tracking ID of the attempt

#### Response

{

  "id": "api.test.attempt.progress",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "tracking\_id": "uuid",

    "test\_id": "uuid",

    "user\_id": "uuid",

    "attempt": 1,

    "timestart": "2024-03-21T10:00:00Z",

    "timeend": null,

    "score": 2,

    "status": "incomplete",

    "total\_content": 1000,

    "current\_position": 500,

    "time\_spent": 90

  }

}

### Get Attempted Questions Count

- **Endpoint**: `GET /tests/attempts/{tracking_id}/progress`  
- **Description**: Gets the number of questions attempted in a test  
- **Content-Type**: `application/json`  
- **Path Parameters**:  
  - tracking\_id: UUID \- Tracking ID of the attempt

#### Response

{

  "id": "api.test.attempted.questions",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "attempted\_questions": 4

  }

}

### Submit Test

- **Endpoint**: `PATCH /tests/attempts/{tracking_id}/submit`  
- **Description**: Submits a completed test attempt  
- **Content-Type**: `application/json`  
- **Path Parameters**:  
  - tracking\_id: UUID \- Tracking ID of the attempt

#### Response

{

  "id": "api.test.submit",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "tracking\_id": "uuid",

    "test\_id": "uuid",

    "user\_id": "uuid",

    "attempt": 1,

    "timestart": "2024-03-21T10:00:00Z",

    "timeend": "2024-03-21T11:00:00Z",

    "score": 80,

    "status": "completed",

    "total\_content": 100,

    "current\_position": 100,

    "time\_spent": 3600

  }

}

### Get Test Results

- **Endpoint**: `GET /tests/attempts/{tracking_id}/results`  
- **Description**: Retrieves test results for a completed attempt  
- **Content-Type**: `application/json`  
- **Path Parameters**:  
  - tracking\_id: UUID \- Tracking ID of the attempt

#### Response

{

  "id": "api.test.results",

  "ver": "1.0",

  "ts": "2024-03-21T10:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null

  },

  "responseCode": 200,

  "result": {

    "tracking": {

      "id": "uuid",

      "test\_id": "uuid",

      "user\_id": "uuid",

      "attempt": 1,

      "timestart": "2024-03-21T10:00:00Z",

      "timeend": "2024-03-21T11:00:00Z",

      "score": 80,

      "status": "completed",

      "total\_content": 100,

      "current\_position": 100,

      "time\_spent": 3600

    },

    "answers": \[

      {

        "id": "uuid",

        "question\_id": "uuid",

        "answer": "User's answer",

        "anss\_order": "1,2,3",

        "marks": 10,

        "question": {

          "id": "uuid",

          "title": "Question Title",

          "description": "Question Description",

          "type": "radio",

          "level": "medium",

          "marks": 10,

          "status": "published",

          "ideal\_time": 300,

          "gradingtype": "quiz",

          "media\_type": "image",

          "media\_id": "uuid",

          "tenant\_id": "uuid"  // Added to response

        }

      }

    \]

  }

}

### Status Codes

- 200: Success  
- 201: Created  
- 400: Bad Request  
- 401: Unauthorized  
- 403: Forbidden  
- 404: Not Found

## Common Response Structure

All API responses follow this general structure:

{

  "id": "string",        // API ID

  "ver": "1.0",         // API version

  "ts": "2024-03-20T00:00:00Z", // Timestamp

  "params": {

    "resmsgid": "uuid",  // Response message ID

    "status": "successful", // 'successful' or 'failed'

    "err": null,         // Error code (if any)

    "errmsg": null,      // Error message (if any)

  },

  "responseCode": number, // HTTP status code

  "result": object | array // Response data

}

## Authentication

- All API endpoints require JWT authentication  
- The tenant\_id and user\_id is automatically extracted from the JWT token  
- All data operations are scoped to the tenant\_id from the token

## Notes

- All timestamps are in ISO 8601 format with timezone  
- UUIDs are in standard UUID v4 format  
- The API requires authentication for all endpoints  
- Tenant isolation is handled automatically through the JWT token  
- Categories cannot be deleted if they have associated questions  
- Questions cannot be deleted if they are associated with any tests  
- Each question must have at least one correct answer  
- The sum of marks for all answers should equal the question's total marks  
- Question type must be one of: radio, checkbox, file\_upload, text, textarea, objtext, rating  
- Question level must be one of: easy, medium, hard  
- Grading type must be one of: quiz, feedback, exercise  
- Media type must be one of: image, pdf, doc, text, audio, youtube, vimeo  
- Media content structure:  
  - For file uploads (images, audio, pdf, doc): Use media\_file with the actual file  
  - For videos (youtube, vimeo): Use media\_url with the video URL  
  - Only one of media\_file or media\_url should be present  
- The API uses multipart/form-data for file uploads  
- Array fields in multipart/form-data should use the format fieldName\[index\]\[subfield\]  
- Media files are stored in the media table with the following structure:  
  - id: UUID  
  - type: Media type (image, pdf, doc, youtube, vimeo, etc.)  
  - path: Base path without filename (e.g., "/uploads/images/")  
  - source: Filename with extension (e.g., "image.jpg")  
  - original\_filename: Original filename  
  - size: File size in bytes  
  - storage: Storage location (local, external)  
  - params: Additional media parameters  
  - tenant\_id: UUID (Added for multi-tenancy)  
- Each media reference includes:  
  - media\_type: Type of media  
  - media\_id: Reference to the media table  
  - media: Complete media information
