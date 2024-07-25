const { ActivityHandler, MessageFactory } = require('botbuilder');
const {MakeReservationDialog} = require('./componentsDialogs/makeReservationDialog.js')
const {CancelReservationDialog} = require('./componentsDialogs/cancelReservationDialog')
const axios = require("axios")

class RRBot extends ActivityHandler {
    constructor(conversationState,userState) {
        super();

        this.conversationState = conversationState;
        this.userState = userState;

        this.dialogState = conversationState.createProperty("dialogState");
        this.makeReservationDialog = new MakeReservationDialog(this.conversationState, this.userState);
        this.cancelReservationDialog = new CancelReservationDialog(this.conversationState,this.userState);

        

        this.previousIntent = this.conversationState.createProperty("previousIntent");
        this.conversationData = this.conversationState.createProperty("conversationData");



        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            // await this.dispatchToIntentAsync(context);
            const CLUResult = await CLURecognizer(context._activity.text);

            const intent = CLUResult.topIntent;
            const entities = CLUResult.entities;

            // console.log(CLUResult);

            await this.dispatchToIntentAsync(context,intent,entities);

            await next();
        });

        this.onDialog(async (context,next) => {
            await this.conversationState.saveChanges(context,false);
            await this.userState.saveChanges(context,false);
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMessage(context)

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
        
        //custom method to configure CLU
        async function CLURecognizer(text) {
        var data = JSON.stringify({
        kind: "Conversation",
        analysisInput: {
            conversationItem: {
              id: "1",
              participantId: "1",
              text: text,
            },
          },
          parameters: {
            projectName: "RRBOT",
            verbose: true,
            deploymentName: "RRBot_Deployement",
            stringIndexType: "TextElement_V8",
          },
        });
        var config = {
          method: "post",
          url: "https://msdkltimrrbot.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2022-10-01-preview",
          headers: {
            "Ocp-Apim-Subscription-Key": "7642f1d0582f4c0caea3af01cc839e1e",
            "Content-Type": "application/json",
          },
          data: data,
        };
        try {
          let resultObj = {
              topIntent : "",
              entities : {},
          }
          const result = await axios(config);
          console.log(result)
          resultObj.topIntent = result.data.result.prediction.topIntent;
        //   for (let i = 0; i < result.data.result.prediction.entities.length; i++) {
        //       if(resultObj.entities.hasOwnProperty(result.data.result.prediction.entities[i].category)){
        //           resultObj.entities[result.data.result.prediction.entities[i].category].push(result.data.result.prediction.entities[i].resolutions[0].value)
        //       } else if(result.data.result.prediction.entities[i].category == "datetimeV2"){
        //         resultObj.entities[result.data.result.prediction.entities[i].category] = []
        //         resultObj.entities[result.data.result.prediction.entities[i].category].push(result.data.result.prediction.entities[i])
        //       } else {
        //           resultObj.entities[result.data.result.prediction.entities[i].category] = []
        //           resultObj.entities[result.data.result.prediction.entities[i].category].push(result.data.result.prediction.entities[i].resolutions[0].value)
        //       }
        //   }
          console.log(resultObj);
          return resultObj;
        } catch (error) {
            console.log(error)
        }
      }
    }

    async sendWelcomeMessage(turnContext){
        const {activity} = turnContext;

        for(const idx in activity.membersAdded){
            if(activity.membersAdded[idx].id !==activity.recipient.id){
                const welcomeMessage = `Welcome to Restaurant Reservation Bot ${activity.membersAdded[idx].name}.`;
                await turnContext.sendActivity(welcomeMessage);
                await this.sendSuggestedActions(turnContext);
            }
        }
    }

    async sendSuggestedActions(turnContext){
        var reply = MessageFactory.suggestedActions(['Make Reservation','Cancel Reservation','Restaurant Address'],'What would you like to do today?');
        await turnContext.sendActivity(reply);
    }

    // async dispatchToIntentAsync(context,intent,entities){
    //     // console.log('dispatchToIntentAsync - recieved Text:',context.activity.text);
    //     var currentIntent ='';
    //     const previousIntent = await this.previousIntent.get(context,{});
    //     const conversationData = await this.conversationData.get(context,{});

    //     if(previousIntent.intentName && conversationData.endDialog === false ){
    //         currentIntent = previousIntent.intentName;
    //     }
    //     else if(previousIntent.intentName && conversationData.endDialog === true){
    //         currentIntent = intent;
    //     }
    //     else{
    //         currentIntent = intent;
    //         await this.previousIntent.set(context,{intentName: intent});
    //     }

    //     switch(currentIntent){


    //         case 'Make_Reservation':
    //         console.log('Inside Make Reservation Case')
    //         await this.conversationData.set(context,{endDialog:false});
    //         await this.makeReservationDialog.run(context,this.dialogState);
    //         conversationData.endDialog = await this.makeReservationDialog.isDialogComplete();
    //         if(conversationData.endDialog){
    //             await this.previousIntent.set(context,{intentName: null});
    //             await this.sendSuggestedActions(context);
    //         }
    //         break;

    //         case 'Cancel_Reservation':
    //         console.log('Inside Cancel Reservation Case')
    //         await this.conversationData.set(context,{endDialog:false});
    //         await this.cancelReservationDialog.run(context,this.dialogState);
    //         conversationData.endDialog = await this.cancelReservationDialog.isDialogComplete();
    //         if(conversationData.endDialog){
    //             await this.previousIntent.set(context,{intentName: null});
    //             await this.sendSuggestedActions(context);
    //         }
    //         break;

    //         default: 
    //         console.log("Did not match Make Reservation Case");
    //         break;
    //     }
        
    // }
    // onTurn(context, next) {
    //     console.log('onTurn - received activity type:', context.activity.type);
    //     return super.onTurn(context, next);
    // }


    //New line of Copy paste code
    async dispatchToIntentAsync(context,intent, entities,qnaResult){
 
        var currentIntent = '';
        const previousIntent = await this.previousIntent.get(context,{});
        const conversationData = await this.conversationData.get(context,{});  
 
        if(previousIntent.intentName && conversationData.endDialog === false ){
           currentIntent = previousIntent.intentName;
        }else if (previousIntent.intentName && conversationData.endDialog === true){
             currentIntent = intent;
        // }else if(intent === "None" && !previousIntent.intentName){
        //     console.log('Inside the Qna Elseif')
        //     await context.sendActivity(`${qnaResult.answers[0].answer}`);
        //     await this.sendSuggestedActions(context);
        }
        else{
            currentIntent = intent;
            await this.previousIntent.set(context,{intentName: intent});
        }
        switch(currentIntent){
 
            case 'Make Reservation':
                console.log("Inside Make Reservation Case");
                await this.conversationData.set(context,{endDialog: false});
                await this.makeReservationDialog.run(context,this.dialogState,entities);
                conversationData.endDialog = await this.makeReservationDialog.isDialogComplete();
                if(conversationData.endDialog){
                    await this.previousIntent.set(context,{intentName: null});
                    await this.sendSuggestedActions(context);
                }
            break;
 
            case 'Cancel Reservation':
                console.log("Inside Cancel Reservation Case");
                await this.conversationData.set(context,{endDialog: false});
                await this.cancelReservationDialog.run(context,this.dialogState);
                conversationData.endDialog = await this.cancelReservationDialog.isDialogComplete();
                if(conversationData.endDialog){
                    await this.previousIntent.set(context,{intentName: null});
                    await this.sendSuggestedActions(context);
                }
            break;
 
            default:
                console.log("Did not match any case");
                break;
        }
    }

}

module.exports.RRBot = RRBot;
