const { ActivityHandler, MessageFactory } = require('botbuilder');
const {MakeReservationDialog} = require('./componentsDialogs/makeReservationDialog.js')
const {CancelReservationDialog} = require('./componentsDialogs/cancelReservationDialog')


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
            await this.dispatchToIntentAsync(context);
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

    async dispatchToIntentAsync(context){
        // console.log('dispatchToIntentAsync - recieved Text:',context.activity.text);
        var currentIntent ='';
        const previousIntent = await this.previousIntent.get(context,{});
        const conversationData = await this.conversationData.get(context,{});

        if(previousIntent.intentName && conversationData.endDialog === false ){
            currentIntent = previousIntent.intentName;
        }
        else if(previousIntent.intentName && conversationData.endDialog === true){
            currentIntent = context.activity.text;
        }
        else{
            currentIntent = context.activity.text;
            await this.previousIntent.set(context,{intentName: context.activity.text});
        }

        switch(currentIntent){


            case 'Make Reservation':
            console.log('Inside Make Reservation Case')
            await this.conversationData.set(context,{endDialog:false});
            await this.makeReservationDialog.run(context,this.dialogState);
            conversationData.endDialog = await this.makeReservationDialog.isDialogComplete();
            if(conversationData.endDialog){
                await this.previousIntent.set(context,{intentName: null});
                await this.sendSuggestedActions(context);
            }
            break;

            case 'Cancel Reservation':
            console.log('Inside Cancel Reservation Case')
            await this.conversationData.set(context,{endDialog:false});
            await this.cancelReservationDialog.run(context,this.dialogState);
            conversationData.endDialog = await this.cancelReservationDialog.isDialogComplete();
            if(conversationData.endDialog){
                await this.previousIntent.set(context,{intentName: null});
                await this.sendSuggestedActions(context);
            }
            break;

            default: 
            console.log("Did not match Make Reservation Case");
            break;
        }
        
    }
    // onTurn(context, next) {
    //     console.log('onTurn - received activity type:', context.activity.type);
    //     return super.onTurn(context, next);
    // }

}

module.exports.RRBot = RRBot;
