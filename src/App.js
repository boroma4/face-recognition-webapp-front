import React,{Component} from 'react';
import Navigation from "./components/Navigation/Navigation";
import Logo from "./components/Logo/Logo";
import Rank from "./components/Rank/Rank";
import Particles from "react-particles-js";
import Clarifai from  'clarifai';
import ImageLinkForm from "./components/ImageLinkForm/ImageLinkForm";
import './App.css';
import './Helper/ParticleOptions';
import {particleOptions} from "./Helper/ParticleOptions";
import FaceRec from "./components/FaceRecognition/FaceRec";
import SignIn from "./components/SignIn/SignIn";
import Registration from "./components/Registration/Registration";
import Cookies from 'universal-cookie';


const ParticleOptions = particleOptions;

const InitialState = {
    input: '',
    imageUrl:'',
    boxes: [],
    route: 'signIn',
    isSignedIn:false,
    user:{
        userId:'',
        name:'',
        score:''
    }
};

const app = new Clarifai.App({
    apiKey: '36e21255dbfa4141a3bf027f932599ae'
});
const cookies = new Cookies();

class App extends Component {
    constructor() {
        super();
        this.state = InitialState;
    }

    componentDidMount() {
        const id = cookies.get('user');
        if(cookies.get('remember') && cookies.get('user')){
           fetch(`https://ghost-server.azurewebsites.net/api/user?id=${id}`)
               .then(response => response.json())
               .then(response=>{
                   this.loadUser(response);
                   this.setState({
                       isSignedIn:true,
                       route:'home'
                   });
               })
               .catch(err=>{
                   console.log(err);
               })
        }
    }

    loadUser = (data,remember= false)=>{
        this.setState({
            input: '',
            imageUrl:'',
            boxes: [],
          user:{
              userId:data.userId,
              name:data.name,
              score:data.score
          }
        });
        if(remember) {
            const userIdStr = this.state.user.userId.toString();
            cookies.set('user',userIdStr, { path: '/' });
        }
    };

    calculateFaceLocation = (data) => {
        const regions = data.outputs[0].data.regions;
        const image = document.getElementById('inputImage');
        const width = Number(image.width);
        const height = Number(image.height);

        let boxes = [];
        regions.forEach(region => {
            const box = region.region_info.bounding_box;
            boxes.push({
                leftCol: box.left_col * width,
                topRow: box.top_row * height,
                rightCol: width - (box.right_col * width),
                bottomRow: height - (box.bottom_row * height)
            });
        });
        return boxes;
    };

    displayDetectionBox = (boxes) => {
        this.setState({boxes});
    };

    onInputChange = (event) => {
         this.setState({input:event.target.value});
    };

    onRouteChange = (route) =>{
        if(route === 'signOut'){
            this.state = InitialState;
            cookies.remove('user',{ path: '/' });
            cookies.set('remember','false',{ path: '/' });
        }else if( route === 'home'){
            this.setState({isSignedIn:true})
        }
       this.setState({route});
    };

    onSubmit = () => {
        this.setState({imageUrl: this.state.input});
        app.models
            .predict(
                Clarifai.FACE_DETECT_MODEL,
                // URL
                this.state.input
            )
            .then(response =>{
                const boxes = this.calculateFaceLocation(response);
                this.displayDetectionBox(boxes);
                    fetch('https://ghost-server.azurewebsites.net/api/user',{
                        method:'post',
                        headers:{'Content-type':'application/json'},
                        body: JSON.stringify({
                            userid: this.state.user.userId,
                            score: boxes.length,
                        })
                    })
                        .then(response=> response.json())
                        .then(user=>{
                            this.setState(Object.assign(this.state.user,{score:user.score}))
                        })
                        .catch(err => console.log(err))
            });
    };

    render() {
        const { isSignedIn, imageUrl, route, boxes} = this.state;
        return (
            <div className="App">
                <Particles className='particles'
                           params={ParticleOptions}
                />
                <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange}/>
                {route === 'home'
                    ? <div>
                        <Logo/>
                        <Rank user = {this.state.user}/>
                        <ImageLinkForm
                            onInputChange={this.onInputChange}
                            onSubmit={this.onSubmit}
                        />
                        <FaceRec
                            boxes={boxes}
                            url={imageUrl}
                        />
                    </div>
                    : (
                        route === 'signIn' || route === 'signOut'
                        ? <SignIn loadUser = {this.loadUser }onRouteChange = {this.onRouteChange}/>
                        : <Registration
                                loadUser = {this.loadUser}
                                onRouteChange = {this.onRouteChange}
                            />
                    )
               }
            </div>
        );
    }
}

export default App;
