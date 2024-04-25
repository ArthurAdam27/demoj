from multiprocessing import Lock, Semaphore, Process
import time
from leds.DemoDisplay import Gauges
from temperature.temp import getCPUtemperature
from wattmeter.DemoWattmeter import *
from rpi_ws281x import Color
from rpi_ws281x import RGBW

SPEED = 0.5 
LED_COUNT = 30
CHANNEL = 0
LED_PIN = 18    
NOCOLOR = Color(0, 0, 0, 0)
RED = Color(255, 0, 0)
GREEN = Color(0, 255, 0)

class ConccurentAnimation(Exception):
    """
    When an other animation is requested while an other animation still running
    """
    def __init__(self, message="Conccurrent animation request detected!"):
        self.message = message
        super().__init__(self.message)

class DemoLedsController:
    """
    A small class to coordinates processes in order to mannipulate the DemoJ Leds with some animations senarios.
    """
    def __init__(self):
        try:
            self.__wattmeter = Wattmeter()
            self.__gauges = Gauges(LED_COUNT, CHANNEL, LED_PIN)
        except WattmeterTimeout:
            print("Wattmeter timed out on init")
        self.__gauges.clearAll()
        self.__loading_color: RGBW = RED
        self.__demoj_process = Process(target=self.__demoj_routine, args=(self.__gauges, self.__wattmeter,), daemon=True)
        self.__loading_process =  Process(target=self.__loading_routine, args=(self.__gauges,), daemon=True)
        self.__current: Process = self.__demoj_process

    def __start(self, p: Process):
        self.__current = p
        p.start()

    def is_running(self) -> bool:
        """
        If an animation process still running. You should run end_animation to end the current process.

        RETURNS: If an animation process still running.
        """
        return self.__current.is_alive()
    
    def __loading_routine(self, gauges: Gauges):
        while True:
            gauges.k2000(self.__loading_color)           

    def loading(self, r: int, g: int, b: int):
        """
        Start the loading led animation process.

        RAISES:
            ConccurentAnimation if the previous animation wasn't terminated.
        """
        if self.is_running(): 
            raise ConccurentAnimation()
        self.__loading_color = Color(r, g, b)
        self.__start(self.__loading_process)
    
    def end_animation(self): 
        """
        End the current running animation. isRunning will return False and all leds will be cleared smoothly
        """
        if self.__current.is_alive(): 
            self.__current.terminate()
            self.__current.join()
            self.__gauges.clearAllSmoothed()

    def loading_done(self):
        """
        This method call end_animation and display green leds for 1 second
        """
        self.end_animation()
        self.__gauges.fillColorSmoothed(GREEN)
        time.sleep(1)
        self.__gauges.clearAllSmoothed()

    def __demoj_routine(self, gauges: Gauges, wattmeter: Wattmeter):
        while True:
            temp: float = getCPUtemperature()
            watts: float = wattmeter.getWattsMW()
            gauges.displayTemp(temp)
            gauges.displayWatts(watts)
            time.sleep(SPEED)
            print(f"temperature : {temp}")
            print(f"watts: {watts/1000}")
    
    def demoj(self):
        """
        Start the demoj gauges default animation process 
        """
        if self.is_running(): 
            raise ConccurentAnimation()
        self.__start(self.__demoj_process)

    def close(self):
        """
        Release resources held by the processes. Error if the animation still running.
        """
        self.end_animation()
        self.__loading_process.close()
        self.__demoj_process.close()