# try:
#     import gevent.monkey
#     gevent.monkey.patch_all()
# except ImportError:
#     pass

try:
    import eventlet
    eventlet.monkey_patch()
except ImportError:
    pass
