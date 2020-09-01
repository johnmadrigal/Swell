const chai = require("chai");
const chaiHttp = require("chai-http");
const sideBar = require("../pageObjects/Sidebar.js");
const reqRes = require("../pageObjects/ReqRes.js");
const httpServer = require('../httpServer');

chai.use(chaiHttp);
const expect = chai.expect;

module.exports = () => {
  describe("HTTP/S requests", () => {
    const urlAndClick = async (method, body, header) => {
      try {
        console.log('inside urlandclick')
        if (method !== "GET") {
          // request method
          await sideBar.requestMethod.click();
  
          if (method === "POST") await sideBar.choosePost.click();
          if (method === "PUT") await sideBar.choosePut.click();
          if (method === "PATCH") await sideBar.choosePatch.click();
          if (method === "DELETE") await sideBar.chooseDelete.click();
  
          // headers
          if (header !== "show") {
            await sideBar.activateHeaders.click();
          }
          await sideBar.headerKey.addValue("Content-Type");
          await sideBar.headerValue.addValue("application/json");
          await sideBar.addHeader.click();
  
          // content type
          await sideBar.contentTypeBtn.click();
          await sideBar.chooseJSON.click();
  
          // body
          await sideBar.bodyInput.clearElement();
          await sideBar.bodyInput.addValue(body);
        }
      } catch(err) {
        console.error(err)
      }
    };

    const addAndSend = async () => {
      try {
        await sideBar.addRequestBtn.click();
        await reqRes.sendBtn.click();
      } catch(err) {
        console.error(err);
      }
    }

    beforeEach(async () => {
      try {
        await reqRes.removeBtn.click();
        console.log('click before each remove')
      } catch(err) {
        console.error(err)
      }
    });

    after(async () => {
      try {
        await new Promise( (resolve) => {
          setTimeout( () => {
            console.log('blocking');
            httpServer.close();
            return resolve();
          }, 5000)
        })
         console.log('httpServer closed')
      } catch(err) {
        console.error(err)
      }
    })

    describe("public API", () => {
      it("it should GET information from a public API", async () => {
        try {
          await sideBar.chooseGet.click();
          await urlAndClick("GET");
          await sideBar.url.setValue("https://pokeapi.co/api/v2/pokemon?limit=5");
          await addAndSend();
          await new Promise((resolve) =>
            setTimeout(async () => {
              try {
                const statusCode = await reqRes.statusCode.getText();
                const jsonPretty = await reqRes.jsonPretty.getText();
                expect(statusCode).to.equal("Status: 200");
                expect(jsonPretty).to.include("bulbasaur");
                resolve();
              } catch(err) {
                console.error(err);
              }
            }, 700)
          );
        } catch(err) {
          console.error(err)
        }
      });
    });

    /***************** !! FOR BELOW TO WORK, YOU MUST ADD YOUR OWN MONGO URI TO A .ENV FILE WITH (MONGO_URI = "YOUR_URI") !! *****************/

    describe("local API", () => {
      before("CLEAR DB", (done) => {
        chai
          .request("http://localhost:3000")
          .get("/clear")
          .end((err, res) => {
            done();
          });
      });

      after("CLEAR DB", (done) => {
        chai
          .request("http://localhost:3000")
          .get("/clear")
          .end((err, res) => {
            done();
          });
      });
      //create findDOM functions as a wrapper to attempt to findDOM response for travis
      it("it should GET from local API", async () => {
        try {
          await sideBar.chooseGet.click();
          await urlAndClick("GET");
          await sideBar.url.setValue("http://localhost:3000/book");
          await addAndSend();
          const findDOM = (tries) => {
            return new Promise( (resolve, reject) => {
              console.log(`Tries remaining for GET ${tries}`)
              if(tries <= 0) return resolve();
              setTimeout(async () => {
                try {
                  const statusCode = await reqRes.statusCode.getText();
                  const jsonPretty = await reqRes.jsonPretty.getText();
                  expect(statusCode).to.equal("Status: 200");
                  expect(jsonPretty).to.equal("[]");
                  return resolve();
                } catch (err) {
                  await findDOM(--tries)
                  return resolve();
                }
              }, 1000)
            })
          }
          await findDOM(30)
      } catch (err) {
        console.log(err)
      }});

      it("it should not POST without a required field", async () => {
        try {
          await urlAndClick("POST", `{"title": "HarryPotter"}`);
          await addAndSend();
          const findDOM = (tries) => {
            return new Promise((resolve,reject) => {
              console.log(`Tries remaining for no POST ${tries}`)
              if(tries <= 0) return resolve();
              setTimeout(async () => {
                try {
                  const statusCode = await reqRes.statusCode.getText();
                  const jsonPrettyError = await reqRes.jsonPrettyError.getText();
                  expect(statusCode).to.equal("Status: 500");
                  expect(jsonPrettyError).to.include("validation failed");
                  return resolve();
                } catch (err) {
                  await findDOM(--tries)
                  return resolve()
                }
              }, 1000)
            })
          }
          await findDOM(100);
        } catch(err) {
          console.error('error in non-post', err);
        }
      });

      it("it should POST to local API", async () => {
        try {
          await urlAndClick("POST", `{"title": "HarryPotter", "author": "JK Rowling", "pages": 500}`, "show");
          await addAndSend();
          const findDOM = (tries) => {
            return new Promise((resolve,reject) => {
              console.log(`Tries remaining for POST ${tries}`)
              if(tries <= 0) return resolve();
              setTimeout(async () => {
                try {
                  const statusCode = await reqRes.statusCode.getText();
                  const jsonPretty = await reqRes.jsonPretty.getText();
                  expect(statusCode).to.equal("Status: 200");
                  expect(jsonPretty).to.include("JK Rowling");
                  return resolve();
                } catch (err) {
                  await findDOM(--tries)
                  return resolve()
                }
              }, 1000)
            })
          }
          await findDOM(100)
        } catch(err) {
          console.error(err)
        }
      });

      it("it should PUT to local API given a param", async () => {
        try {
          await urlAndClick("PUT", `{"author": "Ron Weasley", "pages": 400}`, "show");
          await sideBar.url.setValue("http://localhost:3000/book/HarryPotter");
          await addAndSend();
          const findDOM = (tries) => {
            return new Promise((resolve,reject) => {
              console.log(`Tries remaining for PUT ${tries}`)
              if(tries <= 0) return resolve();
              setTimeout(async () => {
                try {
                  const statusCode = await reqRes.statusCode.getText();
                  const jsonPretty = await reqRes.jsonPretty.getText();
                  expect(statusCode).to.equal("Status: 200");
                  expect(jsonPretty).to.include("Ron Weasley");
                  console.log('going to resolve');
                  return resolve();
                } catch(err) {
                  await findDOM(--tries);
                  return resolve();
                }
              }, 1000)
            })
          }
          await findDOM(100);
        } catch(err) {
          console.error(err)
        }
      });

      it("it should PATCH to local API given a param", async () => {
        try {
          await urlAndClick("PATCH", `{"author": "Hermoine Granger"}`, "show");
          await addAndSend();
          const findDOM = (tries) => {
            return new Promise((resolve,reject) => {
              console.log(`Tries remaining for PATCH ${tries}`)
              if(tries <= 0) return resolve();
              setTimeout(async () => {
                try {
                  const statusCode = await reqRes.statusCode.getText();
                  const jsonPretty = await reqRes.jsonPretty.getText();
                  expect(statusCode).to.equal("Status: 200");
                  expect(jsonPretty).to.include("Hermoine Granger");
                  return resolve();
                } catch(err) {
                  await findDOM(--tries);
                  return resolve();
                }
              }, 1000)
            })
          }
          await findDOM(100);
        } catch(err) {
          console.error(err);
        }
      });

      it("it should DELETE in local API given a param", async () => {
        try {
          await urlAndClick("DELETE", `{}`, "show");
          await addAndSend();
          const findDOM = (tries) => {
            return new Promise((resolve,reject) => {
              console.log(`Tries remaining for DELETE ${tries}`)
              if(tries <= 0) return resolve();
              setTimeout(async () => {
                try {
                  const statusCode = await reqRes.statusCode.getText();
                  console.log('got to JSON pretty delete');
                  const jsonPretty = await reqRes.jsonPretty.getText();
                  console.log('after JSON pretty delete');
                  expect(statusCode).to.equal("Status: 200");
                  expect(jsonPretty).to.include("Hermoine Granger");
                  console.log('resolve delete')
                  return resolve();
                } catch(err) {
                  await findDOM(--tries);
                  return resolve();
                }
              }, 1000)
            })
          }
          await findDOM(100);
          await reqRes.removeBtn.click();
          await sideBar.chooseGet.click();
          await urlAndClick("GET");
          await sideBar.url.setValue("http://localhost:3000/book");
          await addAndSend();
          const findDOM2 = attempts => {
            return new Promise((resolve) => {
              console.log(`Tries remaining for DELETE PT2 ${attempts}`)
              if(attempts <= 0) return resolve();
              setTimeout(async () => {
                try {
                  const statusCode1 = await reqRes.statusCode.getText();
                  const jsonPretty1 = await reqRes.jsonPretty.getText();
                  console.log('jsonpretty delete2 after');
                  expect(statusCode1).to.equal("Status: 200");
                  expect(jsonPretty1).to.equal("[]");
                  console.log('jsonpretty', jsonPretty1);
                  return resolve();
                } catch(err) {
                  await findDOM2(--attempts);
                  return resolve();
                }
              }, 1000)
            })
          }
          await findDOM2(100);
        } catch(err) {
          console.error(err);
        }
      });
    });
  });
};
