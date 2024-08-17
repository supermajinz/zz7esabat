import { Vector3 } from "three";
class SubmarineRotation {
    constructor(submarine) {
        this.submarine = submarine; 
        this.theta_y0 = 0; // الزاوية الأفقية الابتدائية بالرديان
        this.omega_y0 = 0; // السرعة الزاوية الأفقية الابتدائية بالرديان/ثانية
        this.alpha_y = 0; // التسارع الزاوي الأفقي بالرديان/ثانية^2
        this.currentTime = 0; // الوقت الحالي بالثواني
        this.I_y=1125;//(1.5)^2*1000*0.5>>>>>m=1000,r=1.5
        this.t=0.01;
    }


    // التابع لحساب التسارع الزاوي الأفقي بفرض ذراع القوة تساوي 2 متر 
    CurrentHorizontalAngularAccelerate(F ) {
        this.alpha_y = F *2  / this.I_y;
        return this.alpha_y;
    }

    // التابع لحساب السرعة الزاوية الأفقية
    NextHorizontalAngularVelocity() {
        let omega_y = this.omega_y0 + this.alpha_y * this.t;
        return omega_y;
    }

    // التابع لحساب الزاوية الأفقية
    NextHorizontalAngle() {
        let theta_y = this.theta_y0 + this.omega_y0 *this.t + 0.5 * this.alpha_y * this.t * this.t;
        return theta_y;
    }

    // التابع لتحريك الغواصة أفقياً
    HorizontalAngularMotionInMoment(submarine,F) {
        this.CurrentHorizontalAngularAccelerate(F);
        let omega_y = this.NextHorizontalAngularVelocity();
        let theta_y = this.NextHorizontalAngle();
        if(F==0){
            omega_y=0;
        }
        this.omega_y0 = omega_y;
        this.theta_y0 = theta_y;
        this.currentTime += this.t;
       
        submarine.rotation.y = theta_y;

    }
}

export default SubmarineRotation;



// class SubmarineRotation {
//   constructor() {
//       this.verticalAngularVelocity = 0;
//       this.verticalAngle = 0;
//       this.horizontalAngularVelocity = 0;
//       this.horizontalAngle = 0;
//   }

//   currentVerticalAngularAccelerate(forceVector, inertia) {
//       return forceVector.z / inertia;
//   }

//   nextVerticalAngularVelocity(forceVector, inertia, deltaTime) {
//       const angularAcceleration = this.currentVerticalAngularAccelerate(forceVector, inertia);
//       this.verticalAngularVelocity += angularAcceleration * deltaTime;
//       return this.verticalAngularVelocity;
//   }

//   nextVerticalAngle(forceVector, inertia, deltaTime) {
//       const angularVelocity = this.nextVerticalAngularVelocity(forceVector, inertia, deltaTime);
//       this.verticalAngle += angularVelocity * deltaTime;
//       return this.verticalAngle;
//   }

//   verticalAngularMotionInMoment(submarine, forceVector, inertia, deltaTime) {
//       const angle = this.nextVerticalAngle(forceVector, inertia, deltaTime);
//       submarine.rotation.z = angle;
//   }

//   currentHorizontalAngularAccelerate(forceVector, inertia) {
//       return forceVector.y / inertia;
//   }

//   nextHorizontalAngularVelocity(forceVector, inertia, deltaTime) {
//       const angularAcceleration = this.currentHorizontalAngularAccelerate(forceVector, inertia);
//       this.horizontalAngularVelocity += angularAcceleration * deltaTime;
//       return this.horizontalAngularVelocity;
//   }

//   nextHorizontalAngle(forceVector, inertia, deltaTime) {
//       const angularVelocity = this.nextHorizontalAngularVelocity(forceVector, inertia, deltaTime);
//       this.horizontalAngle += angularVelocity * deltaTime;
//       return this.horizontalAngle;
//   }

//   horizontalAngularMotionInMoment(submarine, forceVector, inertia, deltaTime) {
//       const angle = this.nextHorizontalAngle(forceVector, inertia, deltaTime);
//       submarine.rotation.y = angle;
//   }
// }export default SubmarineRotation;