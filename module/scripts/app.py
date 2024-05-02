from leds_process_control import DemoLedsController
from multiprocessing import Process, Condition
from zocket import socket_routine
from rpi_ws281x import Color

def termination():
    if socket_proc.is_alive():
        socket_proc.terminate()
    socket_proc.join()
    socket_proc.close()
    print("Terminated")

if __name__ == "__main__":
    leds = DemoLedsController()
    
    try:
        while True: #restart the server if it crash
            cond = Condition()
            socket_proc = Process(target=socket_routine, args=(cond,))
            print("loading")
            leds.loading(255, 0, 0)
            socket_proc.start()
            cond.acquire()
            cond.wait() # wait for socket connection
            print("loading done")
            leds.loading_done()

            leds.demoj()
            cond.wait() # wait for crash. or finish?
            cond.release()
            termination()
    except KeyboardInterrupt:
        pass
    finally:
        termination()
        leds.close()
