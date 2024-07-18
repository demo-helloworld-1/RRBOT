const { ActivityHandler, MessageFactory } = require('botbuilder');
const {MakeReservationDialog} = require('./componentsDialogs/makeReservationDialog.js')
class RRBot extends ActivityHandler {
    constructor(conversationState,userState) {
        super();

        this.conversationState = conversationState;
        this.userState = userState;

        this.dialogState = conversationState.createProperty("dialogState");
        this.makeReservationDialog = new MakeReservationDialog(this.conversationState, this.userState);



        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            
            await dispatchToIntentAsync(context);

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

        switch(context.activity.text){
            case "Make Reservation":
                await this.makeReservationDialog.run(context,this.dialogState);
                break;


            default: 
            console.log("Did not match Make Reservation Case");
            break;
        }



    }

}

module.exports.RRBot = RRBot;
